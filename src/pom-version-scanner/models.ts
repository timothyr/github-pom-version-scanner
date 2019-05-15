import { Observable } from 'rxjs';

export interface Dependency {
  artifactId: string;
  version: string;
}

export interface PomFile {
  path: string;
  dependencies: Dependency[];
}

export interface RepositoryOwner {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  url: string;
  html_url: string;
}

export interface Repository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  owner: RepositoryOwner;
  private: boolean;
  html_url: string;
  description: string;
  fork: boolean;
  url: string;
}

export interface RepositoryPoms {
  repository: Repository;
  poms: PomFile[];
  error: string;
}

export interface OrgScanner {
  repositories: Repository[];
  observable: Observable<RepositoryPoms>;
  error: string;
}
