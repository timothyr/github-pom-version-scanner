import { Component, OnInit, OnDestroy } from '@angular/core';
import { scanOrg } from 'src/pom-version-scanner/scanner';
import { OrgScanner, RepositoryPoms, Repository } from 'src/pom-version-scanner/models';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs';


interface RepositoryPomDisplay extends RepositoryPoms {
  isLoading: boolean;
}

@Component({
  selector: 'app-scan-results',
  templateUrl: './scan-results.component.html',
  styleUrls: ['./scan-results.component.css']
})
export class ScanResultsComponent implements OnInit, OnDestroy {

  orgName = 'librespot-org';
  results: RepositoryPomDisplay[] = [];
  error = '';
  isScanning = false;
  routeSubscription: Subscription;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    // Scan the org specified in the url
    this.routeSubscription = this.route.paramMap.pipe(
      switchMap((params: ParamMap) => this.scan(params.get('org')))
    ).subscribe();
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  async scan(org: string): Promise<void> {
    this.isScanning = true;
    this.error = '';
    this.results = [];

    const orgScanner: OrgScanner = await scanOrg(org);

    // Check for error
    this.error = orgScanner.error;
    if (this.error) {
      this.isScanning = false;
      return;
    }

    // Set repositories to the current scans repositories
    this.results = orgScanner.repositories.map(repository => {
      const repositoryPomDisplay: RepositoryPomDisplay = {
        repository,
        poms: null,
        error: null,
        isLoading: true,
      }

      return repositoryPomDisplay;
    });

    // Subscribe to RepositoryPom observable
    // Will return results as network requests complete
    orgScanner.observable.subscribe(
      // On result
      (result: RepositoryPoms) => {
        // Find matching repository in the results list
        const repositoryPomDisplay: RepositoryPomDisplay = this.results.find(
          r => r.repository.full_name === result.repository.full_name);

        // Update values
        repositoryPomDisplay.error = result.error;
        repositoryPomDisplay.poms = result.poms;
        repositoryPomDisplay.isLoading = false;
      },
      // On error
      (_) => {},
      // On complete
      () => {
        this.isScanning = false;
      }
    );
  }

}
