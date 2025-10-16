import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseDetails } from './purchase-details';

describe('PurchaseDetails', () => {
  let component: PurchaseDetails;
  let fixture: ComponentFixture<PurchaseDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchaseDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
