import { Linter } from "eslint";
import LintMessage = Linter.LintMessage;
declare function preprocess(text: string, fileName: string): {
    text: string;
    filename: string;
}[];
declare function postprocess(messages: LintMessage[][], fileName: string): Linter.LintMessage[] | {
    ruleId: string;
    severity: number;
    message: any;
    source: any;
    line: any;
    column: any;
}[];
export declare const processors: {
    ".yml": {
        preprocess: typeof preprocess;
        postprocess: typeof postprocess;
    };
    ".yaml": {
        preprocess: typeof preprocess;
        postprocess: typeof postprocess;
    };
};
export {};
