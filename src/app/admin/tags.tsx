import { CatalogCrudScreen } from '@/components/admin/catalog-crud-screen';
import { adminTagsService } from '@/services/admin-catalogs';

export default function TagsScreen() {
  return (
    <CatalogCrudScreen
      service={adminTagsService}
      entityName="etiqueta"
      entityNamePlural="etiquetas"
      fallbackIcon="pricetag-outline"
    />
  );
}
