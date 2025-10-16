import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierDetails } from './supplier-details';

describe('SupplierDetails', () => {
  let component: SupplierDetails;
  let fixture: ComponentFixture<SupplierDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
