import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { tooltipInfo } from "../utils/ToolTip-info"
export function TooltipWrapper({ tooltipCallName, children }) {
    const content = tooltipInfo[tooltipCallName]

    if (!content) {
        // no tooltip found → just render children without tooltip
        return <>{children}</>
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent>{content}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
