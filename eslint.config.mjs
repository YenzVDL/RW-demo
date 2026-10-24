import {defineConfig,globalIgnores} from 'eslint/config';
import next from 'eslint-config-next/core-web-vitals';
import ts from 'eslint-config-next/typescript';
export default defineConfig([...next,...ts,globalIgnores(['.next/**','.runtime/**','content/raw/**','public/**','next-env.d.ts','test-results/**']),{rules:{'@next/next/no-img-element':'off'}}]);
