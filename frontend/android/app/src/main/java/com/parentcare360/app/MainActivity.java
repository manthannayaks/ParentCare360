package com.parentcare360.app;

import android.webkit.WebView;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private long lastBackPressedTime = 0;
    private Toast exitToast;

    @Override
    public void onBackPressed() {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }

        // If at the root of the app, double-tap back within 2 seconds to exit safely
        if (lastBackPressedTime + 2000 > System.currentTimeMillis()) {
            if (exitToast != null) {
                exitToast.cancel();
            }
            super.onBackPressed();
        } else {
            exitToast = Toast.makeText(this, "Press back again to exit", Toast.LENGTH_SHORT);
            exitToast.show();
            lastBackPressedTime = System.currentTimeMillis();
        }
    }
}
