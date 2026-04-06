import * as React from "react"
import { View, Button as TaroButton } from "@tarojs/components"
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
    
    // 微信小程序端且有 openType 时，使用 Taro Button
    if (isWeapp && openType) {
      return (
        <TaroButton
          className={cn(
            buttonVariants({ variant, size, className }),
            disabled && "opacity-50 pointer-events-none"
          )}
          openType={openType}
          disabled={disabled}
          onGetPhoneNumber={onGetPhoneNumber}
          onGetUserInfo={onGetUserInfo}
          onOpenSetting={onOpenSetting}
          onChooseAvatar={onChooseAvatar}
          onContact={onContact}
        >
          {(props as any).children}
        </TaroButton>
      )
    }
    
    // H5 端或有 openType 但不是小程序时
    if (openType && !isWeapp) {
      return (
        <View
          className={cn(
            buttonVariants({ variant, size, className }),
            disabled && "opacity-50 pointer-events-none"
          )}
          onClick={() => Taro.showToast({ title: '请在微信小程序中使用此功能', icon: 'none' })}
          ref={ref}
        >
          {(props as any).children}
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
