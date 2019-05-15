import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanResultsComponent } from './scan-results.component';

describe('ScanResultsComponent', () => {
  let component: ScanResultsComponent;
  let fixture: ComponentFixture<ScanResultsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScanResultsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScanResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
