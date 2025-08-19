import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeldSparksComponent } from './weld-sparks.component';

describe('WeldSparksComponent', () => {
  let component: WeldSparksComponent;
  let fixture: ComponentFixture<WeldSparksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeldSparksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeldSparksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
