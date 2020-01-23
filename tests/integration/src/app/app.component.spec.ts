import { TestBed, async } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AppComponent } from './app.component';

import { _4K16Module } from '@carbon/icons-angular/lib/4K/16';
import { QCircuitComposer16Module } from '@carbon/icons-angular/lib/Q/circuit-composer/16';
import { WatsonHealth3DCursor16Module } from '@carbon/icons-angular/lib/watson-health/3D-Cursor/16';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
      imports: [
        _4K16Module,
        QCircuitComposer16Module,
        WatsonHealth3DCursor16Module
      ]
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have a standard icon`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const icon = fixture.debugElement.query(By.css('ibm-icon-4-k16'));
    expect(icon.nativeElement.firstElementChild.tagName).toEqual('svg');
  });

  it(`should have a ibm q icon`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const icon = fixture.debugElement.query(By.css('ibm-icon-q-circuit-composer16'));
    expect(icon.nativeElement.firstElementChild.tagName).toEqual('svg');
  });

  it(`should have a watson health icon`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const icon = fixture.debugElement.query(By.css('ibm-icon-watson-health3-d-cursor16'));
    expect(icon.nativeElement.firstElementChild.tagName).toEqual('svg');
  });
});
