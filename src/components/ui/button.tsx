import * as React from "react"
import { View } from "@tarojs/components"
import Taro from "@tarojs/taro"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary hover:bg-opacity-90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive hover:bg-opacity-90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary hover:bg-opacity-80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof View>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  disabled?: boolean
  className?: string
  openType?: 'share' | 'getPhoneNumber' | 'getUserInfo' | 'launchApp' | 'openSetting' | 'feedback' | 'chooseAvatar' | 'agreePrivacyAuthorization' | 'contact' | 'getRealtimePhoneNumber' | 'getAuthorize'
  onGetPhoneNumber?: (e: any) => void
  onGetUserInfo?: (e: any) => void
  onOpenSetting?: (e: any) => void
  onChooseAvatar?: (e: any) => void
  onContact?: (e: any) => void
}

const Button = React.forwardRef<React.ElementRef<typeof View>, ButtonProps>(
  ({ className, variant, size, asChild = false, disabled, openType, onGetPhoneNumber, onGetUserInfo, onOpenSetting, onChooseAvatar, onContact, ...props }, ref) => {
    const tabIndex = (props as { tabIndex?: number }).tabIndex ?? (disabled ? -1 : 0)
    const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
    
    // 微信小程序端且有 openType 时，使用原生 button
    if (isWeapp && openType) {
      // 微信小程序 button 的特殊属性
      const buttonProps: Record<string, any> = {
        className: "w-full h-full flex items-center justify-center gap-2 bg-transparent border-0 p-0 m-0",
        'open-type': openType,
        disabled,
        style: { lineHeight: 'normal' },
      }
      if (onGetPhoneNumber) buttonProps['bindgetphonenumber'] = onGetPhoneNumber
      if (onGetUserInfo) buttonProps['bindgetuserinfo'] = onGetUserInfo
      if (onOpenSetting) buttonProps['bindopensetting'] = onOpenSetting
      if (onChooseAvatar) buttonProps['bindchooseavatar'] = onChooseAvatar
      if (onContact) buttonProps['bindcontact'] = onContact
      
      return (
        <View
          className={cn(
            buttonVariants({ variant, size, className }),
            disabled && "opacity-50 pointer-events-none",
            "p-0 border-0 bg-transparent"
          )}
          ref={ref}
        >
          <button {...buttonProps}>
            {(props as any).children}
          </button>
        </View>
      )
    }
    
    return (
      <View
        className={cn(
          buttonVariants({ variant, size, className }),
          disabled && "opacity-50 pointer-events-none"
        )}
        ref={ref}
        {...({ tabIndex } as { tabIndex?: number })}
        hoverClass={
          disabled
            ? undefined
            : "border-ring ring-2 ring-ring ring-offset-2 ring-offset-background"
        }
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
