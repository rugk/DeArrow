import * as React from "react";
import { RenderedTitleSubmission } from "./TitleDrawerComponent";
import ResetIcon from "../svgIcons/resetIcon";
import Config from "../config/config";

export interface TitleComponentProps {
    submission: RenderedTitleSubmission;
    selected: boolean;
    onSelectOrUpdate: (title: string, oldTitle: string) => void;
    onDeselect: () => void;
}

const maxTitleLength = 110;

export const TitleComponent = (props: TitleComponentProps) => {
    const titleRef = React.useRef<HTMLDivElement>(null);
    const title = React.useRef(props.submission.title);
    const [titleChanged, setTitleChanged] = React.useState(false);
    const [focused, setFocused] = React.useState(false);

    React.useEffect(() => {
        if (focused && title.current === "") {
            // Now it has padding added, time to set selection
            setSelectionToEnd(titleRef.current!);
        }
    }, [focused]);

    React.useEffect(() => {
        titleRef.current!.innerText = props.submission.title;
    }, []);

    const showTitleHint = !focused && title.current === "";
    return (
        <div className={`cbTitle${props.selected ? " cbTitleSelected" : ""}`}
                onClick={() => {
                    const title = titleRef.current!.innerText;
                    props.onSelectOrUpdate(title, title);

                    if (document.activeElement !== titleRef.current) {
                        setFocused(true);
                        setSelectionToEnd(titleRef.current!);
                    }
                }}
                onBlur={() => {
                    setFocused(false);
                }}>

            <span className={`cbTitleTextHint ${!showTitleHint ? "cbHiddenTextBox" : ""}`}>
                {chrome.i18n.getMessage("TypeYourOwnTitleHere")}
            </span>

            <span ref={titleRef}
                contentEditable={true}
                className={`cbTitleTextBox ${showTitleHint ? "cbHiddenTextBox" : ""}`}
                style={{
                    paddingRight: title.current === "" ? "0.5em" : "0"
                }}
                onInput={(e) => {
                    e.stopPropagation();

                    const target = e.target as HTMLTextAreaElement;
                    const newTitle = target.innerText;

                    if (!Config.config!.vip && target.innerText.length > maxTitleLength) {
                        target.innerText = target.innerText.substring(0, maxTitleLength);
                        setSelectionToEnd(target);
                        return;
                    }
                    
                    if (newTitle !== title.current) {
                        props.onSelectOrUpdate(newTitle, title.current);
                        title.current = newTitle;
    
                        setTitleChanged(newTitle !== props.submission.title);
                        setFocused(true);
                    }
                }}
                onKeyDown={(e) => {
                    e.stopPropagation()

                    // Prevent newlines
                    if (e.key === "Enter") {
                        e.preventDefault();
                    }
                }}
                onKeyUp={(e) => {
                    e.stopPropagation()
                }}
                onPaste={(e) => {
                    e.preventDefault();

                    const text = e.clipboardData?.getData?.("text/plain")?.replace(/\n/g, " ") ?? "";
                    document.execCommand("insertText", false, text);
                }}>
            </span>

            <button className="resetCustomTitle cbButton" 
                title={chrome.i18n.getMessage("resetCustomTitle")}
                onClick={(e) => {
                    e.stopPropagation();

                    props.onSelectOrUpdate(props.submission.title, titleRef.current!.innerText);
                    props.onDeselect();
                    titleRef.current!.innerText = props.submission.title;
                    title.current = props.submission.title;

                    setTitleChanged(false);

                    if (document.activeElement === titleRef.current) {
                        titleRef.current!.blur();
                    }
                }}>
                <ResetIcon
                    style={{ display: props.selected && titleChanged ? "block" : "none" }} 
                    className="resetCustomTitle"
                />
            </button>
        </div>
    );
};

function setSelectionToEnd(element: HTMLElement) {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    element.focus();
}