import { TestBed, async } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AppComponent } from './app.component';

import { _4KModule, QCircuitComposerModule, WatsonHealth_3DCursorModule } from '@carbon/icons-angular';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
      imports: [
        _4KModule,
        QCircuitComposerModule,
        WatsonHealth_3DCursorModule
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
    const icon = fixture.debugElement.query(By.css('ibm-icon-4-k'));
    expect(icon.nativeElement.firstElementChild.tagName).toEqual('svg');
  });

  it(`should have a ibm q icon`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const icon = fixture.debugElement.query(By.css('ibm-icon-q-circuit-composer'));
    expect(icon.nativeElement.firstElementChild.tagName).toEqual('svg');
  });

  it(`should have a watson health icon`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const icon = fixture.debugElement.query(By.css('ibm-icon-watson-health-3-d-cursor'));
    expect(icon.nativeElement.firstElementChild.tagName).toEqual('svg');
  });
});
