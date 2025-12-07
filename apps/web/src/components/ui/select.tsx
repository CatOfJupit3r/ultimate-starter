import { ClientOnly } from '@tanstack/react-router';
import { merge } from 'lodash-es';
import { Children, forwardRef, useId, useMemo } from 'react';
import type { ForwardRefExoticComponent, ReactElement, ReactNode, Ref, RefAttributes } from 'react';
import { LuCheck, LuChevronDown, LuX } from 'react-icons/lu';
import SelectComponent, { components, createFilter } from 'react-select';
import type {
  ActionMeta,
  ClassNamesConfig,
  DropdownIndicatorProps,
  GroupBase,
  StylesConfig,
  MultiValueRemoveProps,
  ClearIndicatorProps,
  OptionProps,
  MenuProps,
  MenuListProps,
  SingleValueProps,
  Props,
  SelectInstance,
} from 'react-select';
import { List } from 'react-window';

import { cn } from '@~/lib/utils';
import { isOnClient } from '@~/utils/ssr-helpers';

/** select option type */
export interface iOptionType {
  label: string;
  value: string;
  icon?: ReactNode | Nil;
  description?: ReactNode;
  meta?: ReactNode;
}

/**
 * styles that aligns with shadcn/ui
 */
const selectStyles = {
  controlStyles: {
    base: 'flex min-h-9! w-full rounded-md border border-input bg-transparent pl-3 py-1 pr-1 gap-1 text-sm shadow-sm transition-colors hover:cursor-pointer',
    focus: 'outline-none ring-1 ring-ring',
    disabled: 'cursor-not-allowed opacity-50',
  },
  placeholderStyles: 'text-muted-foreground text-sm ml-1 font-medium',
  valueContainerStyles: 'gap-1',
  multiValueStyles:
    'inline-flex items-center gap-2 rounded-md border border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 px-1.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  indicatorsContainerStyles: 'gap-1',
  clearIndicatorStyles: 'p-1 rounded-md',
  indicatorSeparatorStyles: 'bg-muted',
  dropdownIndicatorStyles: 'p-1 rounded-md',
  menu: 'mt-1.5 p-1.5 border border-input bg-background text-sm rounded-lg higher-than-radix-modal dark:bg-popover dark:border-popover-border shadow-md',
  menuList: 'morel-scrollbar',
  groupHeadingStyles: 'py-2 px-1 text-secondary-foreground text-sm font-semibold',
  optionStyles: {
    base: 'hover:cursor-pointer hover:bg-accent hover:text-accent-foreground px-2 py-1.5 rounded-sm text-sm! cursor-default! select-none! outline-none! font-sans',
    focus: 'active:bg-accent/90 bg-accent text-accent-foreground',
    disabled: 'pointer-events-none opacity-50',
    selected: '',
  },
  noOptionsMessageStyles: 'text-muted-foreground py-4 text-center text-sm border border-border rounded-sm',
  label: 'text-muted-foreground text-sm',
  loadingIndicatorStyles: 'flex items-center justify-center h-4 w-4 opacity-50',
  loadingMessageStyles: 'text-accent-foreground p-2 bg-accent',
};

/**
 * This factory method is used to build custom classNames configuration
 */
export const createClassNames = (
  classNames: ClassNamesConfig<iOptionType, boolean, GroupBase<iOptionType>>,
): ClassNamesConfig<iOptionType, boolean, GroupBase<iOptionType>> => ({
  clearIndicator: (state) => cn(selectStyles.clearIndicatorStyles, classNames?.clearIndicator?.(state)),
  container: (state) => cn(classNames?.container?.(state)),
  control: (state) =>
    cn(
      selectStyles.controlStyles.base,
      state.isDisabled && selectStyles.controlStyles.disabled,
      state.isFocused && selectStyles.controlStyles.focus,
      classNames?.control?.(state),
    ),
  dropdownIndicator: (state) => cn(selectStyles.dropdownIndicatorStyles, classNames?.dropdownIndicator?.(state)),
  group: (state) => cn(classNames?.group?.(state)),
  groupHeading: (state) => cn(selectStyles.groupHeadingStyles, classNames?.groupHeading?.(state)),
  indicatorsContainer: (state) => cn(selectStyles.indicatorsContainerStyles, classNames?.indicatorsContainer?.(state)),
  indicatorSeparator: (state) => cn(selectStyles.indicatorSeparatorStyles, classNames?.indicatorSeparator?.(state)),
  input: (state) => cn(classNames?.input?.(state)),
  loadingIndicator: (state) => cn(selectStyles.loadingIndicatorStyles, classNames?.loadingIndicator?.(state)),
  loadingMessage: (state) => cn(selectStyles.loadingMessageStyles, classNames?.loadingMessage?.(state)),
  menu: (state) => cn(selectStyles.menu, classNames?.menu?.(state)),
  menuList: (state) => cn(classNames?.menuList?.(state)),
  menuPortal: (state) => cn(classNames?.menuPortal?.(state), `higher-than-radix-modal pointer-events-auto`),
  multiValue: (state) => cn(selectStyles.multiValueStyles, classNames?.multiValue?.(state)),
  multiValueLabel: (state) => cn(classNames?.multiValueLabel?.(state)),
  multiValueRemove: (state) => cn(classNames?.multiValueRemove?.(state)),
  noOptionsMessage: (state) => cn(selectStyles.noOptionsMessageStyles, classNames?.noOptionsMessage?.(state)),
  option: (state) =>
    cn(
      selectStyles.optionStyles.base,
      state.isFocused && selectStyles.optionStyles.focus,
      state.isDisabled && selectStyles.optionStyles.disabled,
      state.isSelected && selectStyles.optionStyles.selected,
      classNames?.option?.(state),
    ),
  placeholder: (state) => cn(selectStyles.placeholderStyles, classNames?.placeholder?.(state)),
  singleValue: (state) => cn('flex-1', classNames?.singleValue?.(state)),
  valueContainer: (state) => cn(selectStyles.valueContainerStyles, classNames?.valueContainer?.(state)),
});

export const defaultClassNames = createClassNames({});
export const defaultStyles: StylesConfig<iOptionType, boolean, GroupBase<iOptionType>> = {
  input: (base) => ({
    ...base,
    'input:focus': {
      boxShadow: 'none',
    },
  }),
  multiValueLabel: (base) => ({
    ...base,
    whiteSpace: 'normal',
    overflow: 'visible',
  }),
  control: (base) => ({
    ...base,
    transition: 'none',
  }),
  menuList: (base) => ({
    ...base,
    '::-webkit-scrollbar': {
      background: 'transparent',
    },
    '::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '::-webkit-scrollbar-thumb': {
      background: 'hsl(var(--border))',
    },
    '::-webkit-scrollbar-thumb:hover': {
      background: 'transparent',
    },
  }),
};

/**
 * React select custom components
 */
export const DropdownIndicator = (props: DropdownIndicatorProps<iOptionType>) => (
  <components.DropdownIndicator {...props}>
    <LuChevronDown className="h-4 w-4 opacity-50" />
  </components.DropdownIndicator>
);

export const ClearIndicator = (props: ClearIndicatorProps<iOptionType>) => (
  <components.ClearIndicator {...props}>
    <LuX className="h-4 w-4 opacity-50" />
  </components.ClearIndicator>
);

export const MultiValueRemove = (props: MultiValueRemoveProps<iOptionType>) => (
  <components.MultiValueRemove {...props}>
    <LuX className="h-3.5 w-3.5 opacity-50" />
  </components.MultiValueRemove>
);

export const Option = (props: OptionProps<iOptionType, boolean, GroupBase<iOptionType>>) => {
  const { data, isSelected, label } = props;
  const { icon, description, meta } = data;

  return (
    <components.Option {...props}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {icon ? (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground">{icon}</span>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{label}</div>
            {description ? <div className="truncate text-xs text-muted-foreground">{description}</div> : null}
          </div>
        </div>
        {meta || isSelected ? (
          <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
            {meta}
            {isSelected ? <LuCheck className="h-4 w-4" /> : null}
          </div>
        ) : null}
      </div>
    </components.Option>
  );
};

export const SingleValue = (props: SingleValueProps<iOptionType, boolean, GroupBase<iOptionType>>) => {
  const { data, children } = props;
  const { icon, description, meta } = data;

  return (
    <components.SingleValue {...props}>
      <div className="flex min-w-0 items-center gap-2">
        {icon ? (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground">{icon}</span>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate font-medium">{children}</span>
          {description ? <span className="truncate text-xs text-muted-foreground">{description}</span> : null}
        </div>
        {meta ? <span className="shrink-0 text-xs text-muted-foreground">{meta}</span> : null}
      </div>
    </components.SingleValue>
  );
};

// Using Menu and MenuList fixes the scrolling behavior
export const Menu = ({ children, ...props }: MenuProps<iOptionType>) => (
  <components.Menu {...props}>{children}</components.Menu>
);

export const MenuList = (props: MenuListProps<iOptionType>) => {
  const { children, className } = props;

  const childrenArray = Children.toArray(children);

  if (!childrenArray || childrenArray.length - 1 === 0) return <components.MenuList {...props} />;

  return (
    <List
      rowCount={childrenArray.length}
      rowHeight={35}
      rowProps={{ children: childrenArray }}
      // eslint-disable-next-line react/no-unstable-nested-components
      rowComponent={({ index, style }) => <div style={style}>{childrenArray[index]}</div>}
      className={className}
    />
  );
};

const BaseSelect = <IsMulti extends boolean = false>(
  props: Props<iOptionType, IsMulti> & { isMulti?: IsMulti; isDOMTarget?: boolean },
  ref: Ref<SelectInstance<iOptionType, IsMulti, GroupBase<iOptionType>>>,
) => {
  const {
    styles = defaultStyles,
    classNames = {},
    components: componentsFromProps = {},
    isDOMTarget = true,
    ...rest
  } = props;
  const instanceId = useId();

  return (
    <ClientOnly>
      <SelectComponent<iOptionType, IsMulti, GroupBase<iOptionType>>
        ref={ref}
        instanceId={instanceId}
        unstyled
        filterOption={createFilter({
          matchFrom: 'any',
          stringify: (option) => option.label,
        })}
        menuPortalTarget={isDOMTarget && isOnClient ? document.body : undefined}
        components={{
          DropdownIndicator,
          ClearIndicator,
          MultiValueRemove,
          Option,
          SingleValue,
          Menu,
          MenuList,
          ...componentsFromProps,
        }}
        styles={styles}
        classNames={merge(defaultClassNames, classNames)}
        {...rest}
      />
    </ClientOnly>
  );
};

const ForwardedSelect = forwardRef(BaseSelect);

const isGroupOption = (option: iOptionType | GroupBase<iOptionType>): option is GroupBase<iOptionType> =>
  Array.isArray((option as GroupBase<iOptionType>).options);

const flattenOptions = (options?: readonly (iOptionType | GroupBase<iOptionType>)[]): iOptionType[] => {
  if (!options) return [];
  const flattened: iOptionType[] = [];

  options.forEach((entry) => {
    if (isGroupOption(entry)) {
      flattened.push(...entry.options);
    } else {
      flattened.push(entry);
    }
  });

  return flattened;
};

type SingleSelectBaseProps = Props<iOptionType, false, GroupBase<iOptionType>>;
type MultiSelectBaseProps = Props<iOptionType, true, GroupBase<iOptionType>>;

const ForwardedSelectSingle = ForwardedSelect as unknown as ForwardRefExoticComponent<
  SingleSelectBaseProps & RefAttributes<SelectInstance<iOptionType, false, GroupBase<iOptionType>>>
>;

const ForwardedSelectMulti = ForwardedSelect as unknown as ForwardRefExoticComponent<
  MultiSelectBaseProps & RefAttributes<SelectInstance<iOptionType, true, GroupBase<iOptionType>>>
>;

export interface iSingleSelectProps extends Omit<
  SingleSelectBaseProps,
  'value' | 'defaultValue' | 'onChange' | 'isMulti'
> {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null, option: iOptionType | null, action: ActionMeta<iOptionType>) => void;
  onOptionChange?: NonNullable<SingleSelectBaseProps['onChange']>;
}

export const SingleSelect = forwardRef<SelectInstance<iOptionType, false, GroupBase<iOptionType>>, iSingleSelectProps>(
  // eslint-disable-next-line prefer-arrow-callback
  function SingleSelect({ value, defaultValue, onValueChange, onOptionChange, options, ...rest }, ref) {
    const flatOptions = useMemo(() => flattenOptions(options), [options]);

    const computedValue = useMemo<iOptionType | null | undefined>(() => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      return flatOptions.find((option) => option.value === value) ?? null;
    }, [flatOptions, value]);

    const computedDefaultValue = useMemo<iOptionType | null | undefined>(() => {
      if (defaultValue === undefined) return undefined;
      if (defaultValue === null) return null;
      return flatOptions.find((option) => option.value === defaultValue) ?? null;
    }, [defaultValue, flatOptions]);

    return (
      <ForwardedSelectSingle
        {...rest}
        ref={ref}
        options={options}
        value={computedValue}
        defaultValue={computedDefaultValue}
        onChange={(selected, actionMeta) => {
          onOptionChange?.(selected, actionMeta);
          const normalizedOption = selected ?? null;
          onValueChange?.(normalizedOption?.value ?? null, normalizedOption, actionMeta);
        }}
      />
    );
  },
);

export interface iMultiSelectProps extends Omit<
  MultiSelectBaseProps,
  'value' | 'defaultValue' | 'onChange' | 'isMulti'
> {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (values: string[], options: Array<iOptionType>, action: ActionMeta<iOptionType>) => void;
  onOptionChange?: NonNullable<MultiSelectBaseProps['onChange']>;
}

export const MultiSelect = forwardRef<SelectInstance<iOptionType, true, GroupBase<iOptionType>>, iMultiSelectProps>(
  // eslint-disable-next-line prefer-arrow-callback
  function MultiSelect(
    { value, defaultValue, onValueChange, onOptionChange, options, closeMenuOnSelect = false, ...rest },
    ref,
  ) {
    const flatOptions = useMemo(() => flattenOptions(options), [options]);

    const computedValue = useMemo<readonly iOptionType[] | undefined>(() => {
      if (value === undefined) return undefined;
      if (!value || value.length === 0) return [];
      const lookup = new Set(value);
      return flatOptions.filter((option) => lookup.has(option.value));
    }, [flatOptions, value]);

    const computedDefaultValue = useMemo<readonly iOptionType[] | undefined>(() => {
      if (defaultValue === undefined) return undefined;
      if (!defaultValue || defaultValue.length === 0) return [];
      const lookup = new Set(defaultValue);
      return flatOptions.filter((option) => lookup.has(option.value));
    }, [defaultValue, flatOptions]);

    return (
      <ForwardedSelectMulti
        {...rest}
        ref={ref}
        isMulti
        closeMenuOnSelect={closeMenuOnSelect}
        options={options}
        value={computedValue}
        defaultValue={computedDefaultValue}
        onChange={(selected, actionMeta) => {
          onOptionChange?.(selected, actionMeta);
          const normalizedOptions = Array.isArray(selected) ? [...selected] : [];
          onValueChange?.(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            normalizedOptions.map((option) => option.value),
            normalizedOptions,
            actionMeta,
          );
        }}
      />
    );
  },
);

export default ForwardedSelect as <IsMulti extends boolean = false>(
  p: Props<iOptionType, IsMulti> & {
    ref?: RefAttributes<SelectInstance<iOptionType, IsMulti, GroupBase<iOptionType>>>['ref'];

    isMulti?: IsMulti;
  },
) => ReactElement;
