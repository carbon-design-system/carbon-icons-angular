# :stop_sign: @carbon/icons-angular - DEPRECATED :stop_sign:

This library is deprecated in favor of [`@carbon/icons`](https://www.npmjs.com/package/@carbon/icons). 

@carbon/icons is the main icons package for Carbon Design System, hence you'll get updates as soon as they are made.
Additionally, the unpacked size is significantly lower, 38MB compared to 148MB.

To get started with @carbon/icons check out the
[code sandbox demo](https://codesandbox.io/s/gracious-diffie-7khcp3?file=/src/app/app.module.ts).

There are comments added to files to guide you through the usage. The relevant files to look at are:

* [app.module.ts](https://codesandbox.io/s/gracious-diffie-7khcp3?file=/src/app/app.module.ts)
* [app.component.html](https://codesandbox.io/s/gracious-diffie-7khcp3?file=/src/app/app.component.html)
* [typings.d.ts](https://codesandbox.io/s/gracious-diffie-7khcp3?file=/src/typings.d.ts)

---------------------------------------------------------------------------------

> Angular components for icons in digital and software products using the Carbon
> Design System

## Getting started

To install `@carbon/icons-angular` in your project, you will need to run the
following command using [npm](https://www.npmjs.com/):

```bash
npm install -S @carbon/icons-angular
```

If you prefer [Yarn](https://yarnpkg.com/en/), use the following command
instead:

```bash
yarn add @carbon/icons-angular
```

## Usage

Icons in this package support the following sizes: `16`, `20`, `24`, and `32`
pixels. These sizes refer to the width and height of the icon. To reduce bundle
sizes each icon is exported as it's own module, you can use an icon component in
your project by doing the following:

In your module:

```ts
import { AddModule } from '@carbon/icons-angular';

@NgModule({
  // ...
  imports: [
    // ...
    AddModule,
    // ...
  ],
  // ...
})
export class MyModule {}
```

In your component template:

```html
<!-- ... -->
<!-- the directive should be preferd whenever possible -->
<svg ibmIconAdd size="32"></svg>
<!-- but a component is also available -->
<ibm-icon-add size="32"></ibm-icon-add>
<!-- ... -->
```

### Migration notes

Previously (all `v10` versions) a pattern like the following was required

```ts
import { Add32Module } from '@carbon/icons-angular/lib/add/32.js';

@NgModule({
  // ...
  imports: [
    // ...
    Add32Module,
    // ...
  ],
  // ...
})
export class MyModule {}
```
This is no longer supported. All icon module imports must switch to the format outlined above.

### API

Options available to the icon directive or component:

[#](#size) **`@Input() size: string;`**

Choses the size of the component.

Example:

```html
<ibm-icon-add size="16"></ibm-icon-add>
```


[#](#innerClass) **`@Input() innerClass: string;`**

Applies a `classList` to the inner SVG. Use the normal `class` attribute to
apply classes to the host element.

Example:

```html
<ibm-icon-add size="16" innerClass="inner-class" class="host-class"></ibm-icon-add>
```

would result in

```html
<ibm-icon-add size="16" class="host-class">
  <svg class="inner-class"><!-- ... --></svg>
</ibm-icon-add>
```

[#](#ariaLabel) **`@Input() ariaLabel: string;`**

If supplied, should provide an accessible description of the icon.

Example:

```html
<ibm-icon-add size="16" ariaLabel="Add a new item"></ibm-icon-add>
```

[#](#ariaLabelledby) **`@Input() ariaLabelledby: string;`**

If supplied, should link to an element providing an accessible description of
the icon.

Example:

```html
<label id="itemAddLabel">Add a new item</label>
<ibm-icon-add size="16" ariaLabelledby="itemAddLabel"></ibm-icon-add>
```

[#](#ariaHidden) **`@Input() ariaHidden: boolean;`**

Controls the visibility of the underlying SVG to screen readers.

Example:

```html
<ibm-icon-add size="16" ariaHidden="true"></ibm-icon-add>
```

[#](#title) **`@Input() title: string;`**

Adds a `<title>` element to the inner SVG. Most browsers will display this text
as a tooltip when the icon is hovered.

Example:

```html
<ibm-icon-add size="16" title="Add a new item"></ibm-icon-add>
```

[#](#focusable) **`@Input() focusable: boolean;`**

Enables or disables the `focusable` attribute. Set this to explicitly control
whether the underlying element should receive focus. Defaults to `false` in most
cases.

Example:

```html
<ibm-icon-add size="16" focusable="false"></ibm-icon-add>
```

## 🙌 Contributing

We're always looking for contributors to help us fix bugs, build new features,
or help us improve the project documentation. If you're interested, definitely
check out our [Contributing Guide](/.github/CONTRIBUTING.md)! 👀

## 📝 License

Licensed under the [Apache 2.0 License](/LICENSE).
