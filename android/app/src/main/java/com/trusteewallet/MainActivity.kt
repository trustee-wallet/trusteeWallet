package com.trusteewallet

import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import org.devio.rn.splashscreen.SplashScreen
import io.branch.rnbranch.*
import android.content.Intent

class MainActivity : ReactActivity() {
    override protected fun onCreate(savedInstanceState: Bundle?) {
        SplashScreen.show(this)
        super.onCreate(null)
    }

    override protected fun onPause() {
        super.onPause()
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)
    }

    override protected fun onResume() {
        super.onResume()
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
    }

    /**
     * https://help.branch.io/developers-hub/docs/react-native
     */
    override protected fun onStart() {
        super.onStart()
        RNBranchModule.initSession(getIntent().getData(), this)
    }

    /**
     * https://help.branch.io/developers-hub/docs/react-native
     */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        RNBranchModule.onNewIntent(intent)
    }

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "trusteeWallet"

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
