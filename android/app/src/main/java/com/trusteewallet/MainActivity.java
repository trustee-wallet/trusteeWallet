package com.trusteewallet;

import android.os.Bundle;
import android.view.WindowManager;

import com.facebook.react.ReactActivity;

import android.content.Intent;
import android.content.res.Configuration;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;

import android.graphics.Color;

import io.branch.rnbranch.*;
import android.content.Intent;

public class MainActivity extends ReactActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        int currentNightMode = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;

            switch (currentNightMode) {
                case Configuration.UI_MODE_NIGHT_NO: {
                    this.getWindow().getDecorView().setBackgroundColor(Color.parseColor("#F5F5F5"));
                    break;
                }
                case Configuration.UI_MODE_NIGHT_YES:{
                    this.getWindow().getDecorView().setBackgroundColor(Color.BLACK);
                    break;
                }
                case Configuration.UI_MODE_NIGHT_UNDEFINED: {
                    this.getWindow().getDecorView().setBackgroundColor(Color.WHITE);
                }
            }
    }
    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        Intent intent = new Intent("onConfigurationChanged");
        intent.putExtra("newConfig", newConfig);
        this.sendBroadcast(intent);
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegate(this, getMainComponentName()) {
        @Override
        protected ReactRootView createRootView() {
            return new RNGestureHandlerEnabledRootView(MainActivity.this);
            }
        };
    }

    @Override
    protected void onStart() {
        super.onStart();
        RNBranchModule.initSession(getIntent().getData(), this);
    }

    @Override
    protected void onRestart() {
        super.onRestart();
        Intent intent = getIntent();
        setIntent(intent);
        intent.putExtras(this.getIntent());
        intent.putExtra("branch_force_new_session", true);
    }


    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        RNBranchModule.onNewIntent(intent);
    }

    protected String getMainComponentName() {
        return "TrusteeWallet";
    }
}
