import SwiftUI

public struct ConditionalFontWeight: ViewModifier {
    let weight: Font.Weight?

    public init(weight: Font.Weight?) {
        self.weight = weight
    }

    public func body(content: Content) -> some View {
        if #available(macOS 13.0, *), weight != nil {
            content.fontWeight(weight)
        } else {
            content
        }
    }
}

public extension View {
    func conditionalFontWeight(_ weight: Font.Weight?) -> some View {
        self.modifier(ConditionalFontWeight(weight: weight))
    }
}
