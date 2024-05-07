import { CopyString } from "~~/components/nillion/CopyString";
import { retrieveSecretCommand } from "~~/utils/nillion/retrieveSecretCommand";

const RetrieveSecretCommand: React.FC<{
  userKey: string | null;
  storeId: string | null;
  secretName: string;
  secretType: string;
}> = ({ userKey, storeId, secretName, secretType }) => {
  return (
    !process.env.NEXT_PUBLIC_USE_NILLION_CONFIG && (
      <span>
        ✅ Stored {secretType} {secretName} <br /> <CopyString str={storeId || ""} textBefore={`store_id: `} full />
        <br />
        <CopyString str={retrieveSecretCommand(userKey, storeId, secretName)} start={30} end={30} code />
      </span>
    )
  );
};

export default RetrieveSecretCommand;
