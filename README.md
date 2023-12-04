# bemcase

Extension to easily migrate from kebab-cased BEM class names into Pascal/camel-cased BEM classes, and vis versa.

## Examples

Given the selection:

```css
.the-component__the-element--the-modifier
```

Run `Format to Pascal-camel-BEM`, which will convert the selection into:

```css
.TheComponent__theElement--theModifier
```

And run `Format to kebab-BEM` to revert it back.
