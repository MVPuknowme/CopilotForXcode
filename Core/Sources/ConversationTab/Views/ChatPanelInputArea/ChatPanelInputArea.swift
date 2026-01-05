import SwiftUI
import ComposableArchitecture

struct ChatPanelInputArea: View {
    let chat: StoreOf<Chat>
    let r: Double
    let editorMode: Chat.EditorMode
    @FocusState var focusedField: Chat.State.Field?
    
    var body: some View {
        HStack {
            InputAreaTextEditor(chat: chat, r: r, focusedField: $focusedField, editorMode: editorMode)
        }
        .background(Color.clear)
    }
    
    @MainActor
    var clearButton: some View {
        Button(action: {
            chat.send(.clearButtonTap)
        }) {
            Group {
                if #available(macOS 13.0, *) {
                    Image(systemName: "eraser.line.dashed.fill")
                        .scaledFont(.body)
                } else {
                    Image(systemName: "trash.fill")
                        .scaledFont(.body)
                }
            }
            .padding(6)
            .background {
                Circle().fill(Color(nsColor: .controlBackgroundColor))
            }
            .overlay {
                Circle().stroke(Color(nsColor: .controlColor), lineWidth: 1)
            }
        }
        .buttonStyle(.plain)
    }
}
