import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryTreeNode } from './category-tree-node';

describe('CategoryTreeNode', () => {
  let component: CategoryTreeNode;
  let fixture: ComponentFixture<CategoryTreeNode>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryTreeNode]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryTreeNode);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
