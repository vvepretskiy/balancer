export function nonCancelFailoverBalancer({ timeoutMs = 500 } = {}) {
    async function run(...funcs) {
        if (funcs.length === 0) throw new Error("Provide at least one function to run");

        const promises = [];
        const timeout = () => new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs));

        for (let i = 0; i < funcs.length; i++) {
            promises.push(funcs[i]());

            try {
                const result = await Promise.race([
                    ...promises,
                    timeout(),
                ]);
                return result;
            } catch {
                continue;
            }
        }

        throw new Error("All attempts failed");
    }

    return { run };
}
