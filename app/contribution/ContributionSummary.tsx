import { LockKeyhole } from "lucide-react";
import { DriveInfo, UserInfo } from "./types";

type ContributionSummaryProps = {
  userInfo: UserInfo;
  driveInfo?: DriveInfo;
  isEncrypted?: boolean;
};

export function ContributionSummary({
  userInfo,
  driveInfo,
  isEncrypted = false,
}: ContributionSummaryProps) {
  return (
    <div className="bg-gray-50 p-3 rounded-md border">
      <h3 className="text-sm font-medium mb-2">
        {isEncrypted ? "Contributed Data Summary:" : "Data to be contributed:"}
      </h3>
      <ul className="text-xs space-y-1 text-gray-600">
        <li>• Google Profile: {userInfo.name}</li>
        <li>• Email: {userInfo.email}</li>
        {userInfo.locale && <li>• Locale: {userInfo.locale}</li>}
        {driveInfo && (
          <li>• Drive Storage Info: {driveInfo.percentUsed}% used</li>
        )}
      </ul>
      <p className="text-xs mt-2 text-gray-500">
        <LockKeyhole className="h-3 w-3 inline mr-1" />
        {isEncrypted
          ? "This data has been encrypted and stored in your Google Drive."
          : "This data will be encrypted and stored in your Google Drive."}
      </p>
    </div>
  );
}