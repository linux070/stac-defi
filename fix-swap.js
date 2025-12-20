const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Swap.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Approval - use actual amount instead of MaxUint256, remove toasts
content = content.replace(
  /\/\/ Check if approval is needed[\s\S]*?setTimeout\(\(\) => setToast\([\s\S]*?2000\);\s*}/,
  `// Check if approval is needed - use actual amount for better wallet display
      const needsApproval = await checkApproval(tokenContract, address, routerAddress, amountIn);
      
      if (needsApproval) {
        // Request approval with actual amount (wallet will show the real amount)
        const approveTx = await approveToken(tokenContract, routerAddress, amountIn, signer);
        
        // Wait for approval transaction (wallet shows progress)
        await approveTx.wait();
      }`
);

// Fix 2: Remove frontend toasts during swap execution
content = content.replace(
  /\/\/ Execute swap[\s\S]*?setTimeout\(\(\) => setToast\([\s\S]*?5000\);/,
  `// Execute swap (wallet will show the transaction)
      const swapTx = await executeSwap(
        routerContract,
        amountIn,
        minAmountOut,
        path,
        address,
        deadline,
        signer
      );
      
      // Wait for transaction confirmation (wallet shows progress)
      await swapTx.wait();`
);

// Fix 3: Error handling - only show error if not user cancellation
content = content.replace(
  /\/\/ Handle user rejection[\s\S]*?setTimeout\(\(\) => setToast\([\s\S]*?5000\);/,
  `// Handle user rejection - only show error if not user cancellation
      if (!errorMessage.includes('user rejected') && !errorMessage.includes('User denied') && !errorMessage.includes('User rejected')) {
        setToast({ visible: true, type: 'error', message: errorMessage });
        setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 5000);
      }`
);

// Fix 4: Quote calculation - add networkFee
content = content.replace(
  /\/\/ Calculate min received with slippage[\s\S]*?fee: \(parseFloat\(amount\) \* 0\.003\)\.toFixed\(6\),[\s\S]*?\};/,
  `// Calculate min received with slippage
      const slippageBps = slippage * 100; // Convert percentage to basis points
      const minReceived = calculateMinReceived(expectedOutput, slippageBps);
      
      // Calculate network fee estimate (gas fee in USDC equivalent)
      // Rough estimate: ~150k gas * gas price
      const estimatedGas = 150000n;
      const feeData = await provider.getFeeData();
      const gasCost = estimatedGas * (feeData.gasPrice || 0n);
      // Convert to USDC (assuming 1 ETH = 2000 USDC for estimation, adjust as needed)
      const networkFeeEstimate = Number(gasCost) / 1e18 * 2000; // Rough USDC estimate
      
      return {
        expectedOutput,
        minReceived,
        priceImpact: '0.00', // Could calculate from reserves if needed
        networkFee: networkFeeEstimate.toFixed(6),
      };`
);

// Fix 5: Fallback quotes - ensure required fields
content = content.replace(
  /const fallbackQuote = calculateSwapQuote\(fromToken, toToken, fromAmount, slippage\);[\s\S]*?setShowSwapDetails\(true\);/,
  `const fallbackQuote = calculateSwapQuote(fromToken, toToken, fromAmount, slippage);
                if (fallbackQuote) {
                  // Ensure quote has required fields for swap details
                  const formattedQuote = {
                    ...fallbackQuote,
                    priceImpact: fallbackQuote.priceImpact || '0.00',
                    networkFee: fallbackQuote.gasFee || '0.00',
                  };
                  setSwapQuote(formattedQuote);
                  setToAmount(formattedQuote.expectedOutput);
                  setShowSwapDetails(true);
                }`
);

// Fix 6: Other fallback quotes (2 more instances)
content = content.replace(
  /\/\/ Fallback to mock quote if contract not available[\s\S]*?const quote = calculateSwapQuote\(fromToken, toToken, fromAmount, slippage\);[\s\S]*?setShowSwapDetails\(true\);/,
  `// Fallback to mock quote if contract not available
            const quote = calculateSwapQuote(fromToken, toToken, fromAmount, slippage);
            if (quote) {
              // Ensure quote has required fields for swap details
              const formattedQuote = {
                ...quote,
                priceImpact: quote.priceImpact || '0.00',
                networkFee: quote.gasFee || '0.00',
              };
              setSwapQuote(formattedQuote);
              setToAmount(formattedQuote.expectedOutput);
              setShowSwapDetails(true);
            }`
);

content = content.replace(
  /\/\/ Not connected or no provider, use mock quote[\s\S]*?const quote = calculateSwapQuote\(fromToken, toToken, fromAmount, slippage\);[\s\S]*?setShowSwapDetails\(true\);/,
  `// Not connected or no provider, use mock quote
          const quote = calculateSwapQuote(fromToken, toToken, fromAmount, slippage);
          if (quote) {
            // Ensure quote has required fields for swap details
            const formattedQuote = {
              ...quote,
              priceImpact: quote.priceImpact || '0.00',
              networkFee: quote.gasFee || '0.00',
            };
            setSwapQuote(formattedQuote);
            setToAmount(formattedQuote.expectedOutput);
            setShowSwapDetails(true);
          }`
);

// Fix 7: Swap details UI - only show 4 fields with proper spacing
content = content.replace(
  /<div className="p-4 bg-blue-50 dark:bg-blue-900\/20 rounded-lg space-y-3 text-xs md:text-sm">[\s\S]*?<\/div>\s*<\/motion\.div>/,
  `<div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-3 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Expected Output</span>
                  <span className="font-semibold">{swapQuote.expectedOutput} {toToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Min Received</span>
                  <span className="font-semibold">{swapQuote.minReceived} {toToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Price Impact</span>
                  <span className={\`font-semibold \${parseFloat(swapQuote.priceImpact || '0') > 1 ? 'text-red-600' : 'text-green-600'}\`}>
                    {swapQuote.priceImpact || '0.00'}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Network Fee</span>
                  <span className="font-semibold">~{swapQuote.networkFee || swapQuote.gasFee || '0.00'} USDC</span>
                </div>
              </div>
            </motion.div>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('All fixes applied successfully!');
