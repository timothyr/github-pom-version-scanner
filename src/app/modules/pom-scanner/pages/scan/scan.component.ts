import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-scan',
  templateUrl: './scan.component.html',
  styleUrls: ['./scan.component.css']
})
export class ScanComponent implements OnInit {

  orgName = 'locationtech'; //'librespot-org';

  constructor(private router: Router) { }

  ngOnInit() {
  }

  onClickScan(): void {
    this.router.navigate([`/scan/org/${this.orgName}`]);
  }


}
