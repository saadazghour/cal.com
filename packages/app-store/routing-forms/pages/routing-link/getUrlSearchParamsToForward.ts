import type { inferSSRProps } from "@calcom/types/inferSSRProps";

import getFieldIdentifier from "../../lib/getFieldIdentifier";
import type { getServerSideProps } from "./getServerSideProps";

type Props = inferSSRProps<typeof getServerSideProps>;
export function getUrlSearchParamsToForward({
  formResponse,
  fields,
  searchParams,
  teamMembersMatchingAttributeLogic,
}: {
  formResponse: Record<
    string,
    {
      value: number | string | string[];
    }
  >;
  fields: Pick<
    NonNullable<Props["form"]["fields"]>[number],
    "id" | "type" | "options" | "identifier" | "label"
  >[];
  searchParams: URLSearchParams;
  teamMembersMatchingAttributeLogic: number[] | null;
}) {
  type Params = Record<string, string | string[]>;
  const paramsFromResponse: Params = {};
  const paramsFromCurrentUrl: Params = {};

  // Build query params from response
  Object.entries(formResponse).forEach(([key, fieldResponse]) => {
    const foundField = fields.find((f) => f.id === key);
    if (!foundField) {
      // If for some reason, the field isn't there, let's just
      return;
    }
    let valueAsStringOrStringArray =
      typeof fieldResponse.value === "number" ? String(fieldResponse.value) : fieldResponse.value;
    if (foundField.type === "select" || foundField.type === "multiselect") {
      const options = foundField.options || [];
      let arr =
        valueAsStringOrStringArray instanceof Array
          ? valueAsStringOrStringArray
          : [valueAsStringOrStringArray];
      arr = arr.map((idOrLabel) => {
        const foundOptionById = options.find((option) => {
          return option.id === idOrLabel;
        });
        if (foundOptionById) {
          return foundOptionById.label;
        }
        return idOrLabel;
      });
      valueAsStringOrStringArray = foundField.type === "select" ? arr[0] : arr;
    }
    paramsFromResponse[getFieldIdentifier(foundField) as keyof typeof paramsFromResponse] =
      valueAsStringOrStringArray;
  });

  // Build query params from current URL. It excludes route params
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  for (const [name, value] of searchParams.entries()) {
    const target = paramsFromCurrentUrl[name];
    if (target instanceof Array) {
      target.push(value);
    } else {
      paramsFromCurrentUrl[name] = [value];
    }
  }

  const allQueryParams: Params = {
    ...paramsFromCurrentUrl,
    // In case of conflict b/w paramsFromResponse and paramsFromCurrentUrl, paramsFromResponse should win as the booker probably improved upon the prefilled value.
    ...paramsFromResponse,
    ...(teamMembersMatchingAttributeLogic
      ? { ['cal.routedTeamMemberIds']: teamMembersMatchingAttributeLogic.join(",") }
      : null),
  };

  const allQueryURLSearchParams = new URLSearchParams();

  // Make serializable URLSearchParams instance
  Object.entries(allQueryParams).forEach(([param, value]) => {
    const valueArray = value instanceof Array ? value : [value];
    valueArray.forEach((v) => {
      allQueryURLSearchParams.append(param, v);
    });
  });

  return allQueryURLSearchParams;
}
