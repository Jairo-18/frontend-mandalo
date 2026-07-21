import { Text } from 'react-native';

import { DocumentPhotoField } from '@/components/ui/document-photo-field';
import { FormSection } from '@/components/ui/form-section';
import { PhotoField } from '@/components/ui/photo-field';
import { TextField } from '@/components/ui/text-field';
import { VehicleDocumentField } from '@/components/ui/vehicle-document-field';
import { FormErrors } from '@/hooks/use-form-errors';
import { DocumentValue } from '@/lib/upload';

type Props = {
  avatarUri: string | null;
  idFrontUri: string | null;
  idBackUri: string | null;
  onAvatar: (uri: string) => void;
  onIdFront: (uri: string) => void;
  onIdBack: (uri: string) => void;
  vehiclePlate: string;
  onVehiclePlate: (value: string) => void;
  licenseFrontUri: string | null;
  licenseBackUri: string | null;
  onLicenseFront: (uri: string) => void;
  onLicenseBack: (uri: string) => void;
  soat: DocumentValue | null;
  onSoat: (value: DocumentValue) => void;
  technicalInspection: DocumentValue | null;
  onTechnicalInspection: (value: DocumentValue) => void;
  errors: FormErrors;
};

/**
 * Fotos/documentos de verificación del registro de repartidor (obligatorios):
 * rostro + cédula por ambos lados, placa del vehículo, licencia de conducción
 * por ambos lados y SOAT/tecnomecánica (foto o PDF). Un admin los revisa y
 * activa la cuenta.
 */
export function DeliveryVerification({
  avatarUri,
  idFrontUri,
  idBackUri,
  onAvatar,
  onIdFront,
  onIdBack,
  vehiclePlate,
  onVehiclePlate,
  licenseFrontUri,
  licenseBackUri,
  onLicenseFront,
  onLicenseBack,
  soat,
  onSoat,
  technicalInspection,
  onTechnicalInspection,
  errors,
}: Props) {
  return (
    <>
      <Text className="mb-1 mt-2 text-base font-extrabold text-dark">
        Verificación de identidad
      </Text>
      <Text className="mb-4 text-xs leading-4 text-muted">
        Estas fotos las revisa un administrador para activar tu cuenta de
        domiciliario.
      </Text>

      <PhotoField
        label="Foto de tu rostro (obligatoria)"
        pendingUri={avatarUri}
        onChange={onAvatar}
        shape="circle"
        placeholderIcon="person-outline"
        error={errors.avatar}
      />
      <DocumentPhotoField
        label="Documento — por delante"
        uri={idFrontUri}
        onChange={onIdFront}
        error={errors.idFront}
      />
      <DocumentPhotoField
        label="Documento — por detrás"
        uri={idBackUri}
        onChange={onIdBack}
        error={errors.idBack}
      />

      <FormSection label="Vehículo y documentos" />
      <TextField
        label="Placa del vehículo"
        icon="bicycle-outline"
        format="identification"
        value={vehiclePlate}
        onChangeText={onVehiclePlate}
        error={errors.vehiclePlate}
        placeholder="ABC12D"
      />
      <DocumentPhotoField
        label="Licencia de conducción — por delante"
        uri={licenseFrontUri}
        onChange={onLicenseFront}
        error={errors.licenseFront}
        placeholderIcon="car-outline"
      />
      <DocumentPhotoField
        label="Licencia de conducción — por detrás"
        uri={licenseBackUri}
        onChange={onLicenseBack}
        error={errors.licenseBack}
        placeholderIcon="car-outline"
      />
      <VehicleDocumentField
        label="SOAT"
        value={soat}
        onChange={onSoat}
        error={errors.soat}
      />
      <VehicleDocumentField
        label="Tecnomecánica"
        value={technicalInspection}
        onChange={onTechnicalInspection}
        error={errors.technicalInspection}
      />
    </>
  );
}
