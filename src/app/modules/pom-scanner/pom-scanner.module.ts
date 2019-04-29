import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScanComponent } from './pages/scan/scan.component';
import { RouterModule } from '@angular/router';
import { ScanResultsComponent } from './pages/scan-results/scan-results.component';
import { routes } from './pom-scanner.routes';

@NgModule({
  declarations: [ScanComponent, ScanResultsComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forRoot(routes)
  ],
  exports: [FormsModule, RouterModule]
})


export class PomScannerModule { }
