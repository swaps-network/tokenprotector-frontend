import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TokensAllInputComponent } from './tokens-all-input.component';

describe('TokensAllInputComponent', () => {
  let component: TokensAllInputComponent;
  let fixture: ComponentFixture<TokensAllInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TokensAllInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TokensAllInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
