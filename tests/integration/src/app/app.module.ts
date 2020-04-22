import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { _4KModule, QCircuitComposerModule, WatsonHealth_3DCursorModule } from '@carbon/icons-angular';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    _4KModule,
    QCircuitComposerModule,
    WatsonHealth_3DCursorModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
