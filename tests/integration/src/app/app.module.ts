import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { _4K16Module } from '@carbon/icons-angular/lib/4K/16';
import { QCircuitComposer16Module } from '@carbon/icons-angular/lib/Q/circuit-composer/16';
import { WatsonHealth3DCursor16Module } from '@carbon/icons-angular/lib/watson-health/3D-Cursor/16';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    _4K16Module,
    QCircuitComposer16Module,
    WatsonHealth3DCursor16Module
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
