import JSONRPC
import ConversationServiceProvider
import Combine

public protocol ClientToolHandler {
    var onClientToolInvokeEvent: PassthroughSubject<(InvokeClientToolRequest, (AnyJSONRPCResponse) -> Void), Never> { get }
    func invokeClientTool(_ params: InvokeClientToolRequest, completion: @escaping (AnyJSONRPCResponse) -> Void)

    var onClientToolConfirmationEvent: PassthroughSubject<(InvokeClientToolConfirmationRequest, (AnyJSONRPCResponse) -> Void), Never> { get }
    func invokeClientToolConfirmation(_ params: InvokeClientToolConfirmationRequest, completion: @escaping (AnyJSONRPCResponse) -> Void)
}

public final class ClientToolHandlerImpl: ClientToolHandler {
    
    public static let shared = ClientToolHandlerImpl()
    
    public let onClientToolInvokeEvent: PassthroughSubject<(InvokeClientToolRequest, (AnyJSONRPCResponse) -> Void), Never> = .init()
    public let onClientToolConfirmationEvent: PassthroughSubject<(InvokeClientToolConfirmationRequest, (AnyJSONRPCResponse) -> Void), Never> = .init()

    public func invokeClientTool(_ request: InvokeClientToolRequest, completion: @escaping (AnyJSONRPCResponse) -> Void) {
        onClientToolInvokeEvent.send((request, completion))
    }

    public func invokeClientToolConfirmation(_ request: InvokeClientToolConfirmationRequest, completion: @escaping (AnyJSONRPCResponse) -> Void)  {
        onClientToolConfirmationEvent.send((request, completion))
    }
}
