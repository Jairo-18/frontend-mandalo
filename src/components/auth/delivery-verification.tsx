import { Text } from 'react-native';

import { DocumentPhotoField } from '@/components/ui/document-photo-field';
import { PhotoField } from '@/components/ui/photo-field';
import { FormErrors } from '@/hooks/use-form-errors';

type Props = {
  avatarUri: string | null;
  idFrontUri: string | null;
  idBackUri: string | null;
  onAvatar: (uri: string) => void;
  onIdFront: (uri: string) => void;
  onIdBack: (uri: string) => void;
  errors: FormErrors;
};

/**
 * Fotos de verificación del registro de repartidor (obligatorias): rostro +
 * documento por ambos lados. Un admin las revisa y activa la cuenta.
 */
export function DeliveryVerification({
  avatarUri,
  idFrontUri,
  idBackUri,
  onAvatar,
  onIdFront,
  onIdBack,
  errors,
}: Props) {
  return (
    <>
      <Text className="mb-1 mt-2 text-base font-extrabold text-dark">
        Verificación de identidad
      </Text>
      <Text className="mb-4 text-xs leading-4 text-muted">
        Estas fotos las revisa un administrador para activar tu cuenta de
        repartidor.
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
    </>
  );
}
