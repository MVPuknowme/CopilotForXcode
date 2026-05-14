import SharedUIComponents
import SwiftUI

struct RateLimitWarningBanner: View {
    let message: String
    let onDismiss: () -> Void

    @State private var isLinkHovered = false

    var body: some View {
        NotificationBanner(style: .info, isDismissable: true, onDismiss: onDismiss) {
            VStack(alignment: .leading, spacing: 8) {
                Text(message)
                    .foregroundColor(.primary)
                    .frame(maxWidth: .infinity, alignment: .leading)

                Button(action: {
                    if let url = URL(string: "https://aka.ms/github-copilot-rate-limit-error") {
                        NSWorkspace.shared.open(url)
                    }
                }) {
                    Text("Learn more")
                        .underline(isLinkHovered)
                        .foregroundColor(.accentColor)
                }
                .buttonStyle(.plain)
                .onHover { isHovered in
                    isLinkHovered = isHovered
                    DispatchQueue.main.async {
                        if isHovered {
                            NSCursor.pointingHand.push()
                        } else {
                            NSCursor.pop()
                        }
                    }
                }
                .onDisappear {
                    NSCursor.pop()
                }
            }
        }
    }
}
