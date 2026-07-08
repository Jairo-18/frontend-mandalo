import { useState } from 'react';

import { useAppData } from '@/context/app-data';
import { Municipality } from '@/services/catalog';

/**
 * Cascada departamento → municipios (registro y formularios de usuario y
 * negocio): al elegir departamento se cargan sus municipios bajo demanda
 * (con la caché de useAppData) y se resetea el municipio elegido.
 */
export function useMunicipalities() {
  const { getMunicipalities } = useAppData();

  const [departmentId, setDepartmentId] = useState<number>();
  const [municipalityId, setMunicipalityId] = useState<number>();
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loadingMuns, setLoadingMuns] = useState(false);

  /** Cambio de departamento desde el Select (resetea municipio). */
  async function onSelectDepartment(id: number) {
    setDepartmentId(id);
    setMunicipalityId(undefined);
    setMunicipalities([]);
    setLoadingMuns(true);
    try {
      setMunicipalities(await getMunicipalities(id));
    } catch {
      // El interceptor HTTP ya mostró el toast.
    } finally {
      setLoadingMuns(false);
    }
  }

  /**
   * Precarga para edición/preselección: setea depto/municipio guardados y
   * trae la lista de municipios (devuelve la lista por si el caller necesita
   * buscar en ella, p. ej. el preselect por código DANE del registro).
   */
  async function preload(
    deptId?: number,
    munId?: number,
  ): Promise<Municipality[]> {
    setDepartmentId(deptId);
    setMunicipalityId(munId);
    setMunicipalities([]);
    if (!deptId) return [];
    setLoadingMuns(true);
    try {
      const muns = await getMunicipalities(deptId);
      setMunicipalities(muns);
      return muns;
    } catch {
      return [];
    } finally {
      setLoadingMuns(false);
    }
  }

  return {
    departmentId,
    municipalityId,
    setMunicipalityId,
    municipalities,
    loadingMuns,
    onSelectDepartment,
    preload,
  };
}
