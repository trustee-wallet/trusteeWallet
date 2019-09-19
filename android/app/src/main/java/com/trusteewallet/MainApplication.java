package com.trustee.demo;

import android.app.Application;
import java.security.Security;
import androidx.multidex.MultiDexApplication;

import com.facebook.react.ReactApplication;
import com.swmansion.reanimated.ReanimatedPackage;
import com.bluroverly.SajjadBlurOverlayPackage;
import com.github.wumke.RNExitApp.RNExitAppPackage;
import com.cmcewen.blurview.BlurViewPackage;
import com.bitgo.randombytes.RandomBytesPackage;
import com.reactnativecommunity.netinfo.NetInfoPackage;
import cl.json.RNSharePackage;
import com.ocetnik.timer.BackgroundTimerPackage;
import com.reactcommunity.rnlocalize.RNLocalizePackage;
import com.rnfingerprint.FingerprintAuthPackage;
import com.oblador.keychain.KeychainPackage;
import com.airbnb.android.react.lottie.LottiePackage;
import com.reactnativecommunity.webview.RNCWebViewPackage;
import com.horcrux.svg.SvgPackage;
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import com.cardio.RNCardIOPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.github.yamill.orientation.OrientationPackage;
import org.reactnative.camera.RNCameraPackage;
import com.tradle.react.UdpSocketsModule;
import com.peel.react.TcpSocketsModule;
import com.peel.react.rnos.RNOSModule;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import org.pgsqlite.SQLitePluginPackage;
import com.BV.LinearGradient.LinearGradientPackage;

import io.invertase.firebase.RNFirebasePackage;
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;
import io.invertase.firebase.notifications.RNFirebaseNotificationsPackage;
import io.invertase.firebase.analytics.RNFirebaseAnalyticsPackage;
import io.invertase.firebase.storage.RNFirebaseStoragePackage;
import io.invertase.firebase.database.RNFirebaseDatabasePackage;
import io.invertase.firebase.fabric.crashlytics.RNFirebaseCrashlyticsPackage;
import io.invertase.firebase.links.RNFirebaseLinksPackage;

import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.reactlibrary.RNBlocksoftRandomPackage;

import com.flurry.android.FlurryAgent;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends MultiDexApplication implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new ReanimatedPackage(),
            new SajjadBlurOverlayPackage(),
            new RNExitAppPackage(),
            new BlurViewPackage(),
            new RandomBytesPackage(),
            new NetInfoPackage(),
            new RNSharePackage(),
            new BackgroundTimerPackage(),
            new RNLocalizePackage(),
            new FingerprintAuthPackage(),
            new KeychainPackage(),
            new RNDeviceInfo(),
            new LottiePackage(),
            new RNCWebViewPackage(),
            new SvgPackage(),

            new AsyncStoragePackage(),
            new RNCardIOPackage(),
            new RNGestureHandlerPackage(),

            new RNFirebasePackage(),
            new RNFirebaseMessagingPackage(),
            new RNFirebaseNotificationsPackage(),
            new RNFirebaseAnalyticsPackage(),
            new RNFirebaseStoragePackage(),
            new RNFirebaseDatabasePackage(),
            new RNFirebaseCrashlyticsPackage(),
            new RNFirebaseLinksPackage(),

            new VectorIconsPackage(),
            new OrientationPackage(),
            new RNCameraPackage(),
            new SQLitePluginPackage(),
            new LinearGradientPackage(),
            new UdpSocketsModule(),
            new TcpSocketsModule(),
            new RNOSModule(),
            new RNBlocksoftRandomPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    Security.insertProviderAt(new org.conscrypt.OpenSSLProvider(), 1);
    new FlurryAgent.Builder()
    	.withLogEnabled(true)
    	.build(this, "CNCBDF2SR5QSPSHDNZ23");

  }
}
