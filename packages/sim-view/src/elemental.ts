export interface Elemental {
  addRoot(e: Elemental): void
  removeChild(e: Elemental): void
  onRemoveChild(e: Elemental): void
  draw: SVGGraphicsElement
}
