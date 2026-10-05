// Radius alone does not describe the squircle corners used by the controls.
export function copyEffectShape(layer: HTMLElement, styles: CSSStyleDeclaration) {
  for (const property of ["border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius", "corner-top-left-shape", "corner-top-right-shape", "corner-bottom-right-shape", "corner-bottom-left-shape"]) {
    const value = styles.getPropertyValue(property);
    if (value) layer.style.setProperty(property, value);
  }
}
