import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WillComponent } from './index.component';

describe('IndexComponent', () => {
  let component: WillComponent;
  let fixture: ComponentFixture<WillComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WillComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
