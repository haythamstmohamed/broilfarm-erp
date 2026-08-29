# Trader account submission fix verification

The reported mobile error occurred after the trader save mutation completed, when the dialog attempted to call `reset()` through an invalid asynchronous event reference. The sales workspace now shows the **تسجيل بيع** action enabled and the empty-state action changed to **تسجيل أول بيع**, confirming that the trader account from the reported attempt was persisted.

The submission handler was repaired to capture the form element before awaiting the save mutation and reset that captured element only after a successful response. No additional trader account was created during validation.

The repaired sales workspace was also reviewed at a 375 px mobile viewport. Its Arabic RTL layout remains readable and the trader and sales actions stay accessible without the prior reset error path.
