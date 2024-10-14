import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAppContextWithSchema } from "@calcom/app-store/EventTypeAppContext";
import AppCard from "@calcom/app-store/_components/AppCard";
import useIsAppEnabled from "@calcom/app-store/_utils/useIsAppEnabled";
import type { EventTypeAppCardComponent } from "@calcom/app-store/types";
import { WEBAPP_URL } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { SchedulingType } from "@calcom/prisma/enums";
import { Switch, Alert, Select } from "@calcom/ui";

import { SalesforceRecordEnum } from "../lib/recordEnum";
import type { appDataSchema } from "../zod";

const EventTypeAppCard: EventTypeAppCardComponent = function EventTypeAppCard({ app, eventType }) {
  const pathname = usePathname();

  const { getAppData, setAppData, disabled } = useAppContextWithSchema<typeof appDataSchema>();
  const { enabled, updateEnabled } = useIsAppEnabled(app);
  const isRoundRobinLeadSkipEnabled = getAppData("roundRobinLeadSkip");
  const roundRobinSkipCheckRecordOn =
    getAppData("roundRobinSkipCheckRecordOn") ?? SalesforceRecordEnum.CONTACT;
  const isSkipContactCreationEnabled = getAppData("skipContactCreation");
  const createLeadIfAccountNull = getAppData("createLeadIfAccountNull");
  const createNewContactUnderAccount = getAppData("createNewContactUnderAccount");
  const createEventOn = getAppData("createEventOn") ?? SalesforceRecordEnum.CONTACT;
  const { t } = useLocale();

  const recordOptions = [
    { label: t("contact"), value: SalesforceRecordEnum.CONTACT },
    { label: t("salesforce_lead"), value: SalesforceRecordEnum.LEAD },
    { label: t("salesforce_contact_under_account"), value: SalesforceRecordEnum.ACCOUNT },
  ];
  const [createEventOnSelectedOption, setCreateEventOnSelectedOption] = useState(
    recordOptions.find((option) => option.value === createEventOn) ?? recordOptions[0]
  );

  const checkOwnerOptions = [
    { label: t("contact"), value: SalesforceRecordEnum.CONTACT },
    { label: t("salesforce_lead"), value: SalesforceRecordEnum.LEAD },
    { label: t("account"), value: SalesforceRecordEnum.ACCOUNT },
  ];
  const [checkOwnerSelectedOption, setCheckOwnerSelectedOption] = useState(
    checkOwnerOptions.find((option) => option.value === roundRobinSkipCheckRecordOn) ?? checkOwnerOptions[0]
  );

  return (
    <AppCard
      returnTo={`${WEBAPP_URL}${pathname}?tabName=apps`}
      app={app}
      teamId={eventType.team?.id || undefined}
      switchOnClick={(e) => {
        updateEnabled(e);
      }}
      switchChecked={enabled}
      hideSettingsIcon>
      <>
        <div className="mb-4 ml-2">
          <label className="text-emphasis mb-2 align-text-top text-sm font-medium">
            {t("salesforce_create_record_as")}
          </label>
          <Select
            className="mt-2 w-60"
            options={recordOptions}
            value={createEventOnSelectedOption}
            onChange={(e) => {
              if (e) {
                setCreateEventOnSelectedOption(e);
                setAppData("createEventOn", e.value);
              }
            }}
          />
        </div>
        {createEventOnSelectedOption.value === SalesforceRecordEnum.CONTACT ? (
          <div>
            <Switch
              label={t("skip_contact_creation", { appName: "Salesforce" })}
              labelOnLeading
              checked={isSkipContactCreationEnabled}
              onCheckedChange={(checked) => {
                setAppData("skipContactCreation", checked);
              }}
            />
          </div>
        ) : null}
        {createEventOnSelectedOption.value === SalesforceRecordEnum.ACCOUNT ? (
          <>
            <div className="mb-4">
              <Switch
                label={t("salesforce_create_new_contact_under_account")}
                labelOnLeading
                checked={createNewContactUnderAccount}
                onCheckedChange={(checked) => {
                  setAppData("createNewContactUnderAccount", checked);
                }}
              />
            </div>
            <div>
              <Switch
                label={t("salesforce_if_account_does_not_exist")}
                labelOnLeading
                checked={createLeadIfAccountNull}
                onCheckedChange={(checked) => {
                  setAppData("createLeadIfAccountNull", checked);
                }}
              />
            </div>
          </>
        ) : null}

        {eventType.schedulingType === SchedulingType.ROUND_ROBIN ? (
          <div className="mt-4">
            <Switch
              label={t("salesforce_book_directly_with_attendee_owner")}
              labelOnLeading
              checked={isRoundRobinLeadSkipEnabled}
              onCheckedChange={(checked) => {
                setAppData("roundRobinLeadSkip", checked);
                if (checked) {
                  // temporary solution, enabled should always be already set
                  setAppData("enabled", checked);
                }
              }}
            />
            {isRoundRobinLeadSkipEnabled ? (
              <div className="my-4 ml-2">
                <label className="text-emphasis mb-2 align-text-top text-sm font-medium">
                  {t("salesforce_check_owner_of")}
                </label>
                <Select
                  className="mt-2 w-60"
                  options={checkOwnerOptions}
                  value={checkOwnerSelectedOption}
                  onChange={(e) => {
                    if (e) {
                      setCheckOwnerSelectedOption(e);
                      setAppData("roundRobinSkipCheckRecordOn", e.value);
                    }
                  }}
                />
              </div>
            ) : null}
            <Alert className="mt-2" severity="neutral" title={t("skip_rr_description")} />
          </div>
        ) : null}
      </>
    </AppCard>
  );
};

export default EventTypeAppCard;
