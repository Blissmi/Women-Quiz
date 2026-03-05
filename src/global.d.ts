// Allow importing image assets directly in TypeScript/JSX
declare module '*.svg'
declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'

// Declare JSX runtime module to satisfy TypeScript when @types/react is not installed
declare module 'react/jsx-runtime'

// Fallback JSX IntrinsicElements to avoid "JSX.IntrinsicElements" missing errors
// (This makes all intrinsic elements `any`. Installing `@types/react` is recommended.)
declare namespace JSX {
	interface IntrinsicElements {
		[elemName: string]: any
	}
}

// Broad fallback declarations for 'react' and 'react-dom' when @types aren't available.
// These are intentionally permissive; prefer installing the official type packages.
declare module 'react' {
	const React: any
	export default React
	export const useState: any
	export const useEffect: any
	export const useRef: any
	export const useMemo: any
	export const useCallback: any
	export const createElement: any
	export const Fragment: any
}

declare module 'react-dom' {
	const ReactDOM: any
	export default ReactDOM
}
