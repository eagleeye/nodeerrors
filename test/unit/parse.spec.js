"use strict";

function getCyclicObject() {
	var x = {};
	var y = {loop:x};
	x.loop = y;
	return x;
}

describe("When parsing an error", function () {

	var parse = require("../../lib/util/parse");
	var makeErrorFunction = require("../../lib/util/makeErrorFunction");

	it("will wrap a normal exception in a system error", function () {
		var result = parse(new Error("my test"));
		expect(result).to.have.property("id").to.be.a("string");
		expect(result.code).to.equal(1);
		expect(result.message).to.equal("There was an internal server error");
		expect(result.http).to.equal(500);
		expect(result.internal.innerError).to.be.ok;
		expect(result.internal.innerError.message).to.equal("my test");
		expect(result.internal.innerError.stack).to.be.ok;
	});
	it("will handle a cyclic property in innerError", function () {
		var err = new Error("my test");
		err.cyclic = getCyclicObject();
		var result = parse(err);
		expect(result).to.have.property("id").to.be.a("string");
		expect(result.code).to.equal(1);
		expect(result.message).to.equal("There was an internal server error");
		expect(result.http).to.equal(500);
		expect(result.internal.innerError).to.be.ok;
		expect(result.internal.innerError.message).to.equal("my test");
		expect(result.internal.innerError.stack).to.be.ok;
		expect(result.internal.innerError.cyclic).to.equal("[cyclic]");
	});

	it("will handle cyclic property in error, and not return nodeErrors-property", function () {
		var errorCodeSpec = {
			code:999,
			message:"Test",
			http:123456,
			cyclic:getCyclicObject()
		};
		var fn = makeErrorFunction("test", errorCodeSpec);
		var err = fn();
		var result = parse(err);
		expect(result).to.have.property("id").to.be.a("string");
		expect(result.code).to.equal(999);
		expect(result.message).to.equal("Test");
		expect(result.http).to.equal(123456);
		expect(result.cyclic).to.equal("[cyclic]");
		expect(result.internal).to.not.have.property("nodeErrors");
	});
});