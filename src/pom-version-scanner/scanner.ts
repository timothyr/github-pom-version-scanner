// import * as Octokit from './octokit/octokit-rest.min.js';
import JSSoup from 'jssoup';
import { Repository, RepositoryOwner, Dependency, RepositoryPoms, PomFile, OrgScanner } from './models';
import { Subject } from 'rxjs';

declare var Octokit: any;

const octokit = new Octokit();

/**
 * Get list of all repositories for an organization
 *
 * GitHub API rate limits requests to 100 results at a time,
 * so this function loops until less than 100 results are returned.
 * Less than 100 results indicates that we are at the last page of repositories.
 */
async function getAllRepositories(org: string): Promise<any[]> {
  const repositoriesPerRequest = 100;

  const repositories: any[] = [];
  let numRepositoriesInResponse = null;
  let page = 1;

  while (numRepositoriesInResponse === null || numRepositoriesInResponse === repositoriesPerRequest) {
    try {
      // https://developer.github.com/v3/repos/#list-organization-repositories
      await octokit.repos.listForOrg({
        org,
        type: 'all',
        per_page: repositoriesPerRequest,
        page,
      }).then(({ data, status, headers }) => {
        if (status !== 200) {
          throw new Error(`status '${status}' on page ${page} of repository list`);
        }
        // Number of repositories returned
        numRepositoriesInResponse = data.length;
        // Add repositories to total
        repositories.push(...data);
        // Increment page number
        page += 1;
      });
    } catch (error) {
      throw new Error(`Error getting repositories for '${org}': GitHub returned ${error.message}`);
    }
  }

  return repositories;
}

/**
 * Return file details of pom.xml if it exists
 * Returns undefined if no pom.xml exists
 * The object returned does not contain the actual file contents, just a reference to it
 * @param files list of files from a repository
 */
function checkForPomFile(files: any[]) {
  return files.find((file) => file.name === 'pom.xml');
}

/**
 * Return a stripped down version of an Octokit repository
 * Containing only the fields that we might care about
 * @param repository Octokit repository
 */
function stripRepository(repository: any): Repository {
  const owner: RepositoryOwner = {
    login: repository.owner.login,
    id: repository.owner.id,
    node_id: repository.owner.node_id,
    avatar_url: repository.owner.avatar_url,
    url: repository.owner.url,
    html_url: repository.owner.html_url,
  };

  return {
    id: repository.id,
    node_id: repository.node_id,
    name: repository.name,
    full_name: repository.full_name,
    owner,
    private: repository.private,
    html_url: repository.html_url,
    description: repository.description,
    fork: repository.fork,
    url: repository.url,
  };
}

/**
 * Parses a pom.xml file and returns a list of dependency versions
 * @param pomFile contents of the pom.xml file
 */
export function getPomDependencies(pomFile: any): Dependency[] {
  const soup = new JSSoup(pomFile);
  const dependencySoup = soup.findAll('dependency');
  const dependencies: Dependency[] = [];

  // Iterate through all 'dependency' objects
  dependencySoup.forEach((d: any) => {
    // Get artifactId
    let artifactId: string = null;
    try {
      const artifactIdSoup = d.find('artifactId');
      artifactId = artifactIdSoup.getText();
    } catch (_) {}

    // Get version
    let version: string = null;
    if (artifactId) {
      try {
        const versionSoup = d.find('version');
        version = versionSoup.getText();
      } catch(_) {}
    }

    // If version is a variable, attempt to find property that defines it
    if (version && version.startsWith('${') && version.endsWith('}')) {
      // Get the name of the version variable
      const versionVariable = version.slice(2, -1);
      if (versionVariable) {
        // Search for the version variable in the properties section of pom.xml
        const versionResult = findVersionPropertyVariable(versionVariable, soup);
        // If version result was succesful, replace version with the result
        if (versionResult) {
          version = versionResult;
        }
      }
    }

    // If there was trouble parsing the artifactId or version,
    // then the dependency will be ignored
    if (artifactId && version) {
      const dependency: Dependency = {
        artifactId,
        version,
      };

      dependencies.push(dependency);
    }
  });

  return dependencies;
}

/**
 * Attempt to parse version variable from pom dependency.
 * For example ${random.version} should search for
 * <random.version>3.3.3</random.version>
 * and return 3.3.3.
 * Returns null if not found
 * @param versionVariable Variable that contains version
 * @param soup Soup to search in
 */
function findVersionPropertyVariable(versionVariable: string, soup: any): string {
  let version: string = null;
  try {
    const versionVariableSoup = soup.find(versionVariable);
    version = versionVariableSoup.getText();
  } catch (_) {}

  return version;
}

/**
 * Get contents of a GitHub repository.
 * @param repository Repository object from GitHub
 * @param path File path. Empty path returns list of all files
 */
async function getRepositoryFiles(
  repository: Repository,
  path: string): Promise<any> {
  try {
    // https://octokit.github.io/rest.js/#octokit-routes-repos-get-contents
    return await octokit.repos.getContents({
      owner: repository.owner.login,
      repo: repository.name,
      path,
    });
  } catch (error) {
    throw new Error(`GitHub method getRepositoryFiles('${repository.full_name}', '${path}) returned '${error.message}'`);
  }
}

/**
 * Scans a GitHub Repository and returns a list of poms and their dependencies
 * @param repository Repository to scan
 */
async function scanRepository(repository: Repository): Promise<RepositoryPoms> {
  // Get list of all files in the repository
  let repositoryFiles: any;
  try {
    repositoryFiles = await getRepositoryFiles(repository, '');
  } catch (error) {
    // Return object with error message
    return {
      error: error.message,
      poms: null,
      repository,
    };
  }

  // Check for pom.xml file
  const pomFilePath = checkForPomFile(repositoryFiles.data);
  if (!pomFilePath) {
    // Return object with empty poms list
    return {
      error: null,
      poms: [],
      repository,
    };
  }

  // Get pom.xml file contents from GitHub
  let pomFileRef: any;
  try {
    pomFileRef = await getRepositoryFiles(repository, pomFilePath.path);
  } catch (error) {
    // Return object with error message
    return {
      error: error.message,
      poms: null,
      repository,
    };
  }

  // Parse pom.xml file into dependencies
  let pomFileXML: any;
  let dependencies: Dependency[];
  try {
    pomFileXML = window.atob(pomFileRef.data.content);
    dependencies = getPomDependencies(pomFileXML);
  } catch (error) {
    // Return object with error message
    return {
      error: error.message,
      poms: null,
      repository,
    };
  }

  // Compile pom and repository object and return result
  const pomFile: PomFile = {
    dependencies,
    path: pomFilePath.path,
  };

  const poms = [pomFile];

  const repositoryPoms: RepositoryPoms = {
    poms,
    repository,
    error: null,
  };

  return repositoryPoms;
}

export async function scanOrg(org: string): Promise<OrgScanner> {
  let repositories: any[];
  try {
    repositories = await getAllRepositories(org);
  } catch (error) {
    // Return object containing error
    return {
      repositories: null,
      observable: null,
      error: error.message,
    };
  }

  const strippedRepositories = repositories.map(r => stripRepository(r));
  const repositoryPomSubject: Subject<RepositoryPoms> = new Subject<RepositoryPoms>();

  let count = 0;
  strippedRepositories.forEach(async (repo: Repository) => {
    const repositoryPoms: RepositoryPoms = await scanRepository(repo);
    repositoryPomSubject.next(repositoryPoms);
    count += 1;
    if (count === repositories.length) {
      repositoryPomSubject.complete();
    }
  });

  // Return OrgScanner with repositoryPomSubject
  return {
    repositories: strippedRepositories,
    observable: repositoryPomSubject.asObservable(),
    error: null,
  };
}
