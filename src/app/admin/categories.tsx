import { CatalogCrudScreen } from '@/components/admin/catalog-crud-screen';
import { adminCategoriesService } from '@/services/admin-catalogs';

export default function CategoriesScreen() {
  return (
    <CatalogCrudScreen
      service={adminCategoriesService}
      entityName="categoría"
      entityNamePlural="categorías"
      fallbackIcon="grid-outline"
    />
  );
}
