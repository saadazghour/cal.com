"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import Link from "next/link";
import React, { useCallback, useState, useEffect } from "react";
import { Query, Builder, Utils as QbUtils } from "react-awesome-query-builder";
import type { JsonTree, ImmutableTree, BuilderProps } from "react-awesome-query-builder";
import type { UseFormReturn } from "react-hook-form";

import Shell from "@calcom/features/shell/Shell";
import { areTheySiblingEntitites } from "@calcom/lib/entityPermissionUtils";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import type { inferSSRProps } from "@calcom/types/inferSSRProps";
import {
  SelectField,
  FormCard,
  SelectWithValidation as Select,
  TextArea,
  TextField,
  Badge,
  Divider,
} from "@calcom/ui";

import type { RoutingFormWithResponseCount } from "../../components/SingleForm";
import SingleForm, {
  getServerSidePropsForSingleFormView as getServerSideProps,
} from "../../components/SingleForm";
import "../../components/react-awesome-query-builder/styles.css";
import { RoutingPages } from "../../lib/RoutingPages";
import { createFallbackRoute } from "../../lib/createFallbackRoute";
import {
  getQueryBuilderConfigForFormFields,
  getQueryBuilderConfigForAttributes,
  type FormFieldsQueryBuilderConfigWithRaqbFields,
  type AttributesQueryBuilderConfigWithRaqbFields,
} from "../../lib/getQueryBuilderConfig";
import isRouter from "../../lib/isRouter";
import type { GlobalRoute, LocalRoute, SerializableRoute, Attribute } from "../../types/types";

type FormFieldsQueryBuilderState = {
  tree: ImmutableTree;
  config: FormFieldsQueryBuilderConfigWithRaqbFields;
};

type AttributesQueryBuilderState = {
  tree: ImmutableTree;
  config: AttributesQueryBuilderConfigWithRaqbFields;
};

type LocalRouteWithRaqbStates = LocalRoute & {
  formFieldsQueryBuilderState: FormFieldsQueryBuilderState;
  attributesQueryBuilderState: AttributesQueryBuilderState | null;
};

type Route = LocalRouteWithRaqbStates | GlobalRoute;

type AttributesQueryValue = NonNullable<LocalRoute["attributesQueryValue"]>;
type FormFieldsQueryValue = LocalRoute["queryValue"];

const hasRules = (route: Route) => {
  if (isRouter(route)) return false;
  route.queryValue.children1 && Object.keys(route.queryValue.children1).length;
};

const getEmptyRoute = (): Exclude<SerializableRoute, GlobalRoute> => {
  const uuid = QbUtils.uuid();
  const formFieldsQueryValue = { id: uuid, type: "group" } as FormFieldsQueryValue;
  const attributesQueryValue = { id: uuid, type: "group" } as AttributesQueryValue;

  return {
    id: uuid,
    action: {
      type: "eventTypeRedirectUrl",
      value: "",
    },
    // It is actually formFieldsQueryValue
    queryValue: formFieldsQueryValue,
    attributesQueryValue: attributesQueryValue,
  };
};

const Route = ({
  form,
  route,
  routes,
  setRoute,
  formFieldsQueryBuilderConfig,
  attributesQueryBuilderConfig,
  setRoutes,
  moveUp,
  moveDown,
  appUrl,
  disabled = false,
  fieldIdentifiers,
}: {
  form: inferSSRProps<typeof getServerSideProps>["form"];
  route: Route;
  routes: Route[];
  setRoute: (id: string, route: Partial<Route>) => void;
  formFieldsQueryBuilderConfig: FormFieldsQueryBuilderConfigWithRaqbFields;
  attributesQueryBuilderConfig: AttributesQueryBuilderConfigWithRaqbFields | null;
  setRoutes: React.Dispatch<React.SetStateAction<Route[]>>;
  fieldIdentifiers: string[];
  moveUp?: { fn: () => void; check: () => boolean } | null;
  moveDown?: { fn: () => void; check: () => boolean } | null;
  appUrl: string;
  disabled?: boolean;
}) => {
  const { t } = useLocale();
  const isTeamForm = form.teamId !== null;
  const index = routes.indexOf(route);

  const { data: eventTypesByGroup, isLoading } = trpc.viewer.eventTypes.getByViewer.useQuery({
    forRoutingForms: true,
  });

  const eventOptions: { label: string; value: string }[] = [];
  eventTypesByGroup?.eventTypeGroups.forEach((group) => {
    const eventTypeValidInContext = areTheySiblingEntitites({
      entity1: {
        teamId: group.teamId ?? null,
        // group doesn't have userId. The query ensures that it belongs to the user only, if teamId isn't set. So, I am manually setting it to the form userId
        userId: form.userId,
      },
      entity2: {
        teamId: form.teamId ?? null,
        userId: form.userId,
      },
    });

    group.eventTypes.forEach((eventType) => {
      const uniqueSlug = `${group.profile.slug}/${eventType.slug}`;
      const isRouteAlreadyInUse = isRouter(route) ? false : uniqueSlug === route.action.value;

      // If Event is already in use, we let it be so as to not break the existing setup
      if (!isRouteAlreadyInUse && !eventTypeValidInContext) {
        return;
      }

      eventOptions.push({
        label: uniqueSlug,
        value: uniqueSlug,
      });
    });
  });

  // /team/{TEAM_SLUG}/{EVENT_SLUG} -> /team/{TEAM_SLUG}
  const eventTypePrefix =
    eventOptions.length !== 0
      ? eventOptions[0].value.substring(0, eventOptions[0].value.lastIndexOf("/") + 1)
      : "";

  const [customEventTypeSlug, setCustomEventTypeSlug] = useState<string>("");

  useEffect(() => {
    if (!isLoading) {
      const isCustom =
        !isRouter(route) && !eventOptions.find((eventOption) => eventOption.value === route.action.value);
      setCustomEventTypeSlug(isCustom && !isRouter(route) ? route.action.value.split("/").pop() ?? "" : "");
    }
  }, [isLoading]);

  const onChangeFormFieldsQuery = (
    route: Route,
    immutableTree: ImmutableTree,
    config: FormFieldsQueryBuilderConfigWithRaqbFields
  ) => {
    const jsonTree = QbUtils.getTree(immutableTree) as LocalRoute["queryValue"];
    setRoute(route.id, {
      formFieldsQueryBuilderState: { tree: immutableTree, config: config },
      queryValue: jsonTree,
    });
  };

  const onChangeTeamMembersQuery = (
    route: Route,
    immutableTree: ImmutableTree,
    config: AttributesQueryBuilderConfigWithRaqbFields
  ) => {
    const jsonTree = QbUtils.getTree(immutableTree);
    setRoute(route.id, {
      attributesQueryBuilderState: { tree: immutableTree, config: config },
      attributesQueryValue: jsonTree as AttributesQueryValue,
    });
  };

  const renderBuilder = useCallback(
    (props: BuilderProps) => (
      <div className="query-builder-container">
        <div className="query-builder qb-lite">
          <Builder {...props} />
        </div>
      </div>
    ),
    []
  );

  if (isRouter(route)) {
    return (
      <div>
        <FormCard
          moveUp={moveUp}
          moveDown={moveDown}
          deleteField={{
            check: () => routes.length !== 1,
            fn: () => {
              const newRoutes = routes.filter((r) => r.id !== route.id);
              setRoutes(newRoutes);
            },
          }}
          label={
            <div>
              <span className="mr-2">{`Route ${index + 1}`}</span>
            </div>
          }
          className="mb-6">
          <div className="-mt-3">
            <Link href={`${appUrl}/route-builder/${route.id}`}>
              <Badge variant="gray">
                <span className="font-semibold">{route.name}</span>
              </Badge>
            </Link>
            <p className="text-subtle mt-2 text-sm">
              Fields available in <span className="font-bold">{route.name}</span> will be added to this form.
            </p>
          </div>
        </FormCard>
      </div>
    );
  }

  const shouldShowFormFieldsQueryBuilder = (route.isFallback && hasRules(route)) || !route.isFallback;

  const formFieldsQueryBuilder = shouldShowFormFieldsQueryBuilder ? (
    <div>
      <span className="text-emphasis flex w-full items-center text-sm">
        For responses matching the following criteria(matches all by default)
      </span>
      <Query
        {...formFieldsQueryBuilderConfig}
        value={route.formFieldsQueryBuilderState.tree}
        onChange={(immutableTree, formFieldsQueryBuilderConfig) => {
          onChangeFormFieldsQuery(
            route,
            immutableTree,
            formFieldsQueryBuilderConfig as FormFieldsQueryBuilderConfigWithRaqbFields
          );
        }}
        renderBuilder={renderBuilder}
      />
      <Divider className="mb-6 mt-6" />
    </div>
  ) : null;

  const attributesQueryBuilder =
    route.action?.type === "eventTypeRedirectUrl" ? (
      <div className="mt-4">
        {isTeamForm && (
          <span className="text-emphasis flex w-full items-center text-sm">
            and use only the Team Members that match the following criteria(matches all by default)
          </span>
        )}
        <div className="mt-2">
          {route.attributesQueryBuilderState && attributesQueryBuilderConfig && (
            <Query
              {...attributesQueryBuilderConfig}
              value={route.attributesQueryBuilderState.tree}
              onChange={(immutableTree, attributesQueryBuilderConfig) => {
                onChangeTeamMembersQuery(
                  route,
                  immutableTree,
                  attributesQueryBuilderConfig as AttributesQueryBuilderConfigWithRaqbFields
                );
              }}
              renderBuilder={renderBuilder}
            />
          )}
        </div>
      </div>
    ) : null;

  return (
    <FormCard
      className="mb-6"
      moveUp={moveUp}
      moveDown={moveDown}
      label={route.isFallback ? "Fallback Route" : `Route ${index + 1}`}
      deleteField={{
        check: () => routes.length !== 1 && !route.isFallback,
        fn: () => {
          const newRoutes = routes.filter((r) => r.id !== route.id);
          setRoutes(newRoutes);
        },
      }}>
      <div className="-mx-4 mb-4 flex w-full items-center sm:mx-0">
        <div className="cal-query-builder w-full ">
          {formFieldsQueryBuilder}
          <div>
            <div className="text-emphasis flex w-full items-center text-sm">
              <div className="flex flex-grow-0 whitespace-nowrap">
                <span>{t("send_booker_to")}</span>
              </div>
              <Select
                isDisabled={disabled}
                className="data-testid-select-routing-action block w-full flex-grow px-2"
                required
                value={RoutingPages.find((page) => page.value === route.action?.type)}
                onChange={(item) => {
                  if (!item) {
                    return;
                  }
                  const action: LocalRoute["action"] = {
                    type: item.value,
                    value: "",
                  };

                  if (action.type === "customPageMessage") {
                    action.value = "We are not ready for you yet :(";
                  } else {
                    action.value = "";
                  }

                  setRoute(route.id, { action });
                }}
                options={RoutingPages}
              />
              {route.action?.type ? (
                route.action?.type === "customPageMessage" ? (
                  <TextArea
                    required
                    disabled={disabled}
                    name="customPageMessage"
                    className="border-default flex w-full flex-grow"
                    value={route.action.value}
                    onChange={(e) => {
                      setRoute(route.id, { action: { ...route.action, value: e.target.value } });
                    }}
                  />
                ) : route.action?.type === "externalRedirectUrl" ? (
                  <TextField
                    disabled={disabled}
                    name="externalRedirectUrl"
                    className="border-default flex w-full flex-grow text-sm"
                    containerClassName="w-full mt-2"
                    type="url"
                    required
                    labelSrOnly
                    value={route.action.value}
                    onChange={(e) => {
                      setRoute(route.id, { action: { ...route.action, value: e.target.value } });
                    }}
                    placeholder="https://example.com"
                  />
                ) : (
                  <div className="block w-full">
                    <Select
                      required
                      isDisabled={disabled}
                      options={
                        eventOptions.length !== 0
                          ? [{ label: t("custom"), value: "custom" }].concat(eventOptions)
                          : []
                      }
                      onChange={(option) => {
                        if (!option) {
                          return;
                        }
                        if (option.value !== "custom") {
                          setRoute(route.id, { action: { ...route.action, value: option.value } });
                          setCustomEventTypeSlug("");
                        } else {
                          setRoute(route.id, { action: { ...route.action, value: "custom" } });
                          setCustomEventTypeSlug("");
                        }
                      }}
                      value={
                        eventOptions.length !== 0 && route.action.value !== ""
                          ? eventOptions.find(
                              (eventOption) =>
                                eventOption.value === route.action.value && !customEventTypeSlug.length
                            ) || {
                              label: t("custom"),
                              value: "custom",
                            }
                          : undefined
                      }
                    />
                    {eventOptions.length !== 0 &&
                    route.action.value !== "" &&
                    (!eventOptions.find((eventOption) => eventOption.value === route.action.value) ||
                      customEventTypeSlug.length) ? (
                      <>
                        <TextField
                          disabled={disabled}
                          className="border-default flex w-full flex-grow text-sm"
                          containerClassName="w-full mt-2"
                          addOnLeading={eventTypePrefix}
                          required
                          value={customEventTypeSlug}
                          onChange={(e) => {
                            setCustomEventTypeSlug(e.target.value);
                            setRoute(route.id, {
                              action: { ...route.action, value: `${eventTypePrefix}${e.target.value}` },
                            });
                          }}
                          placeholder="event-url"
                        />
                        <div className="mt-2 ">
                          <p className="text-subtle text-xs">
                            {fieldIdentifiers.length
                              ? t("field_identifiers_as_variables_with_example", {
                                  variable: `{${fieldIdentifiers[0]}}`,
                                })
                              : t("field_identifiers_as_variables")}
                          </p>
                        </div>
                      </>
                    ) : (
                      <></>
                    )}
                  </div>
                )
              ) : null}
            </div>
            {attributesQueryBuilder}
          </div>
        </div>
      </div>
    </FormCard>
  );
};

const buildState = ({
  queryValue,
  config,
}:
  | {
      queryValue: FormFieldsQueryValue;
      config: FormFieldsQueryBuilderConfigWithRaqbFields;
    }
  | {
      queryValue: AttributesQueryValue;
      config: AttributesQueryBuilderConfigWithRaqbFields;
    }) => ({
  tree: QbUtils.checkTree(QbUtils.loadTree(queryValue), config),
  config,
});

const deserializeRoute = ({
  route,
  formFieldsQueryBuilderConfig,
  attributesQueryBuilderConfig,
}: {
  route: Exclude<SerializableRoute, GlobalRoute>;
  formFieldsQueryBuilderConfig: FormFieldsQueryBuilderConfigWithRaqbFields;
  attributesQueryBuilderConfig: AttributesQueryBuilderConfigWithRaqbFields | null;
}): Route => {
  return {
    ...route,
    formFieldsQueryBuilderState: buildState({
      queryValue: route.queryValue,
      config: formFieldsQueryBuilderConfig,
    }),
    attributesQueryBuilderState:
      route.attributesQueryValue && attributesQueryBuilderConfig
        ? buildState({
            queryValue: route.attributesQueryValue,
            config: attributesQueryBuilderConfig,
          })
        : null,
  };
};

const Routes = ({
  form,
  hookForm,
  appUrl,
  attributes,
}: {
  form: inferSSRProps<typeof getServerSideProps>["form"];
  hookForm: UseFormReturn<RoutingFormWithResponseCount>;
  appUrl: string;
  attributes: Attribute[] | null;
}) => {
  const { routes: serializedRoutes } = hookForm.getValues();
  const { t } = useLocale();

  const formFieldsQueryBuilderConfig = getQueryBuilderConfigForFormFields(hookForm.getValues());
  const attributesQueryBuilderConfig = attributes
    ? getQueryBuilderConfigForAttributes({
        attributes: attributes,
        form: hookForm.getValues(),
      })
    : null;

  const [routes, setRoutes] = useState(() => {
    const transformRoutes = () => {
      const _routes = serializedRoutes || [getEmptyRoute()];
      _routes.forEach((r) => {
        if (isRouter(r)) return;
        if (!r.queryValue?.id) {
          r.queryValue = { id: QbUtils.uuid(), type: "group" } as LocalRoute["queryValue"];
        }
      });
      return _routes;
    };

    return transformRoutes().map((route) => {
      if (isRouter(route)) return route;
      return deserializeRoute({
        route,
        formFieldsQueryBuilderConfig,
        attributesQueryBuilderConfig,
      });
    });
  });

  const { data: allForms } = trpc.viewer.appRoutingForms.forms.useQuery();

  const availableRouters =
    allForms?.filtered
      .filter(({ form: router }) => {
        const routerValidInContext = areTheySiblingEntitites({
          entity1: {
            teamId: router.teamId ?? null,
            // group doesn't have userId. The query ensures that it belongs to the user only, if teamId isn't set. So, I am manually setting it to the form userId
            userId: router.userId,
          },
          entity2: {
            teamId: hookForm.getValues().teamId ?? null,
            userId: hookForm.getValues().userId,
          },
        });
        return router.id !== hookForm.getValues().id && routerValidInContext;
      })
      .map(({ form: router }) => {
        return {
          value: router.id,
          label: router.name,
          name: router.name,
          description: router.description,
          isDisabled: false,
        };
      }) || [];

  const isConnectedForm = (id: string) => form.connectedForms.map((f) => f.id).includes(id);

  const routerOptions = (
    [
      {
        label: "Create a New Route",
        value: "newRoute",
        name: null,
        description: null,
      },
    ] as {
      label: string;
      value: string;
      name: string | null;
      description: string | null;
      isDisabled?: boolean;
    }[]
  ).concat(
    availableRouters.map((r) => {
      // Reset disabled state
      r.isDisabled = false;

      // Can't select a form as router that is already a connected form. It avoids cyclic dependency
      if (isConnectedForm(r.value)) {
        r.isDisabled = true;
      }
      // A route that's already used, can't be reselected
      if (routes.find((route) => route.id === r.value)) {
        r.isDisabled = true;
      }
      return r;
    })
  );

  const [animationRef] = useAutoAnimate<HTMLDivElement>();

  const mainRoutes = routes.filter((route) => {
    if (isRouter(route)) return true;
    return !route.isFallback;
  });

  let fallbackRoute = routes.find((route) => {
    if (isRouter(route)) return false;
    return route.isFallback;
  });

  if (!fallbackRoute) {
    fallbackRoute = deserializeRoute({
      route: createFallbackRoute(),
      formFieldsQueryBuilderConfig,
      attributesQueryBuilderConfig,
    });
    setRoutes((routes) => {
      // Even though it's obvious that fallbackRoute is defined here but TypeScript just can't figure it out.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return [...routes, fallbackRoute!];
    });
    return null;
  } else if (routes.indexOf(fallbackRoute) !== routes.length - 1) {
    // Ensure fallback is last
    setRoutes((routes) => {
      // Even though it's obvious that fallbackRoute is defined here but TypeScript just can't figure it out.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return [...routes.filter((route) => route.id !== fallbackRoute!.id), fallbackRoute!];
    });
  }

  const setRoute = (id: string, route: Partial<Route>) => {
    const index = routes.findIndex((route) => route.id === id);
    const newRoutes = [...routes];
    newRoutes[index] = { ...routes[index], ...route };
    setRoutes(newRoutes);
  };

  const swap = (from: number, to: number) => {
    setRoutes((routes) => {
      const newRoutes = [...routes];
      const routeToSwap = newRoutes[from];
      newRoutes[from] = newRoutes[to];
      newRoutes[to] = routeToSwap;
      return newRoutes;
    });
  };

  const routesToSave = routes.map((route) => {
    if (isRouter(route)) {
      return route;
    }
    return {
      id: route.id,
      action: route.action,
      isFallback: route.isFallback,
      queryValue: route.queryValue,
      attributesQueryValue: route.attributesQueryValue,
    };
  });

  hookForm.setValue("routes", routesToSave);

  const fields = hookForm.getValues("fields");

  const fieldIdentifiers = fields ? fields.map((field) => field.identifier ?? field.label) : [];

  return (
    <div className="bg-default border-subtle flex flex-col-reverse rounded-md border p-8 md:flex-row">
      <div ref={animationRef} className="w-full ltr:mr-2 rtl:ml-2">
        {mainRoutes.map((route, key) => {
          return (
            <Route
              form={form}
              appUrl={appUrl}
              key={route.id}
              formFieldsQueryBuilderConfig={formFieldsQueryBuilderConfig}
              attributesQueryBuilderConfig={attributesQueryBuilderConfig}
              route={route}
              fieldIdentifiers={fieldIdentifiers}
              moveUp={{
                check: () => key !== 0,
                fn: () => {
                  swap(key, key - 1);
                },
              }}
              moveDown={{
                // routes.length - 1 is fallback route always. So, routes.length - 2 is the last item that can be moved down
                check: () => key !== routes.length - 2,
                fn: () => {
                  swap(key, key + 1);
                },
              }}
              routes={routes}
              setRoute={setRoute}
              setRoutes={setRoutes}
            />
          );
        })}
        <SelectField
          placeholder={t("select_a_router")}
          containerClassName="mb-6 data-testid-select-router"
          isOptionDisabled={(option) => !!option.isDisabled}
          label={t("add_a_new_route")}
          options={routerOptions}
          key={mainRoutes.length}
          onChange={(option) => {
            if (!option) {
              return;
            }
            const router = option.value;
            if (router === "newRoute") {
              const newEmptyRoute = getEmptyRoute();
              const newRoutes = [
                ...routes,
                {
                  ...newEmptyRoute,
                  formFieldsQueryBuilderState: buildState({
                    queryValue: newEmptyRoute.queryValue,
                    config: formFieldsQueryBuilderConfig,
                  }),
                  attributesQueryBuilderState:
                    attributesQueryBuilderConfig && newEmptyRoute.attributesQueryValue
                      ? buildState({
                          queryValue: newEmptyRoute.attributesQueryValue,
                          config: attributesQueryBuilderConfig,
                        })
                      : null,
                },
              ];

              setRoutes(newRoutes);
            } else {
              const routerId = router;
              if (!routerId) {
                return;
              }
              setRoutes([
                ...routes,
                {
                  isRouter: true,
                  id: routerId,
                  name: option.name,
                  description: option.description,
                } as Route,
              ]);
            }
          }}
        />

        <div>
          <Route
            form={form}
            formFieldsQueryBuilderConfig={formFieldsQueryBuilderConfig}
            attributesQueryBuilderConfig={attributesQueryBuilderConfig}
            route={fallbackRoute}
            routes={routes}
            setRoute={setRoute}
            setRoutes={setRoutes}
            appUrl={appUrl}
            fieldIdentifiers={fieldIdentifiers}
          />
        </div>
      </div>
    </div>
  );
};

export default function RouteBuilder({
  form,
  appUrl,
  enrichedWithUserProfileForm,
}: inferSSRProps<typeof getServerSideProps> & { appUrl: string }) {
  return (
    <SingleForm
      form={form}
      appUrl={appUrl}
      enrichedWithUserProfileForm={enrichedWithUserProfileForm}
      Page={({ hookForm, form }) => {
        const { t } = useLocale();
        const values = hookForm.getValues();
        const { data: attributes, isPending: isAttributesLoading } =
          trpc.viewer.appRoutingForms.getAttributesForTeam.useQuery(
            { teamId: values.teamId! },
            { enabled: !!values.teamId }
          );
        // If hookForm hasn't been initialized, don't render anything
        // This is important here because some states get initialized which aren't reset when the hookForm is reset with the form values and they don't get the updated values
        if (!hookForm.getValues().id) {
          return null;
        }

        // Only team form needs attributes
        if (values.teamId) {
          if (isAttributesLoading) {
            return <div>Loading...</div>;
          }
          if (!attributes) {
            return <div>{t("something_went_wrong")}</div>;
          }
        }

        return (
          <div className="route-config">
            <Routes hookForm={hookForm} appUrl={appUrl} form={form} attributes={attributes || null} />
          </div>
        );
      }}
    />
  );
}

RouteBuilder.getLayout = (page: React.ReactElement) => {
  return (
    <Shell backPath="/apps/routing-forms/forms" withoutMain={true}>
      {page}
    </Shell>
  );
};

export { getServerSideProps };
