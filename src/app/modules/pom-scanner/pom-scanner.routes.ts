import { Routes } from '@angular/router';
import { ScanComponent } from './pages/scan/scan.component';
import { ScanResultsComponent } from './pages/scan-results/scan-results.component';

export const routes: Routes = [
  { path: '', component: ScanComponent },
  { path: 'scan/org/:org', component: ScanResultsComponent },
];
