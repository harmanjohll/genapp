import { mountSankey } from '../components/sankey.js';
import { mountTariffSparkline } from '../components/tariff-sparkline.js';

export function mountZone2(data) {
  mountSankey(data);
  mountTariffSparkline(data);
}
