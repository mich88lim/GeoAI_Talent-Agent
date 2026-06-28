import * as L from 'leaflet'

type HeatPoint = [number, number] | [number, number, number]

declare module 'leaflet' {
  function heatLayer(latlngs: HeatPoint[], options?: HeatLayerOptions): HeatLayer

  interface HeatLayerOptions {
    minOpacity?: number
    maxZoom?: number
    max?: number
    radius?: number
    blur?: number
    gradient?: Record<number, string>
  }

  interface HeatLayer extends L.Layer {
    setLatLngs(latlngs: HeatPoint[]): this
    addLatLng(latlng: HeatPoint): this
    setOptions(options: HeatLayerOptions): this
    redraw(): this
  }
}
