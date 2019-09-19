package com.reactlibrary;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;

import java.security.SecureRandom;
import android.util.Base64;


public class RNBlocksoftRandomModule extends ReactContextBaseJavaModule {

  private final ReactApplicationContext reactContext;

  public RNBlocksoftRandomModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "RNBlocksoftRandom";
  }

  /**
  * PUBLIC REACT API
  * getRandomBytes()
    */
  @ReactMethod
  public void getRandomBytesPublic(int size, final Promise promise) {
    try {
      promise.resolve(getRandomBytesPrivate(size));
    } catch (Exception ex) {
      promise.reject("ERR_UNEXPECTED_EXCEPTION", ex);
    }
  }


  private String getRandomBytesPrivate(int size) {
    SecureRandom sr = new SecureRandom();
    byte[] output = new byte[size];
    sr.nextBytes(output);
    return Base64.encodeToString(output, Base64.NO_WRAP);
  }
}
